const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const User = require('../models/user.model');
const Wallet = require('../models/wallet.model');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Wallet API', function () {
  this.timeout(30000);   // Increase timeout for DB operations
  
  let testUser;
  let authToken;

  before(async () => {
    // Clear test-specific data to avoid conflicts
    await User.deleteMany({ email: { $regex: /wallet.*@example\.com/ } });
    await Wallet.deleteMany({});
    
    // Create a test user with unique email/username
    const uid = uuidv4().slice(0, 8);
    testUser = new User({
      name: 'Test User',
      username: `wallet_${uid}`,
      email: `wallet_${uid}@example.com`,
      password: 'hashedpassword123',
      avatar: 'https://example.com/avatar.jpg'
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  after(async () => {
    // Safe cleanup with guards
    if (testUser?._id) await User.findByIdAndDelete(testUser._id);
    await Wallet.deleteMany({ userId: testUser?._id });
  });

  describe('GET /api/v1/wallet/balance', () => {
    it('should return wallet balance for authenticated user', async () => {
      const res = await chai
        .request(app)
        .get('/api/v1/wallet/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('balancePaise');
      expect(res.body.data.balancePaise).to.be.a('number');
      expect(res.body.data.balancePaise).to.be.at.least(0);
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await chai
        .request(app)
        .get('/api/v1/wallet/balance');

      expect(res).to.have.status(401);
    });
  });

  describe('POST /api/v1/wallet/recharge', () => {
    it('should successfully recharge wallet with valid amount', async () => {
      const rechargeAmount = 10000; // 100.00 INR in paise

      const res = await chai
        .request(app)
        .post('/api/v1/wallet/recharge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amountPaise: rechargeAmount });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('balancePaise');
      expect(res.body.data).to.have.property('transaction');
      expect(res.body.data.balancePaise).to.be.at.least(rechargeAmount);
      
      // Verify transaction details
      const transaction = res.body.data.transaction;
      expect(transaction).to.have.property('type', 'recharge');
      expect(transaction).to.have.property('amountPaise', rechargeAmount);
      expect(transaction).to.have.property('transactionId');
      expect(transaction).to.have.property('description');
      expect(transaction.description).to.include('dummy payment provider');
    });

    it('should fail with negative amount', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/wallet/recharge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amountPaise: -1000 });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('Invalid amount');
    });

    it('should fail with zero amount', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/wallet/recharge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amountPaise: 0 });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('Invalid amount');
    });

    it('should fail with non-numeric amount', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/wallet/recharge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amountPaise: 'invalid' });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('Invalid amount');
    });

    it('should fail with missing amount', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/wallet/recharge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('Invalid amount');
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await chai
        .request(app)
        .post('/api/v1/wallet/recharge')
        .send({ amountPaise: 1000 });

      expect(res).to.have.status(401);
    });

    it('should maintain transaction history', async () => {
      // First recharge
      await chai
        .request(app)
        .post('/api/v1/wallet/recharge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amountPaise: 5000 });

      // Second recharge
      await chai
        .request(app)
        .post('/api/v1/wallet/recharge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amountPaise: 3000 });

      // Get transactions
      const res = await chai
        .request(app)
        .get('/api/v1/wallet/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('transactions');
      expect(res.body.data.transactions).to.be.an('array');
      expect(res.body.data.transactions.length).to.be.at.least(2);
    });
  });

  describe('GET /api/v1/wallet/transactions', () => {
    it('should return transaction history for authenticated user', async () => {
      const res = await chai
        .request(app)
        .get('/api/v1/wallet/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('transactions');
      expect(res.body.data.transactions).to.be.an('array');
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await chai
        .request(app)
        .get('/api/v1/wallet/transactions');

      expect(res).to.have.status(401);
    });
  });
}); 