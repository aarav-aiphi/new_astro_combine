const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const app = require('../app');
const User = require('../models/user.model');
const Astrologer = require('../models/astrologer.model');
const Wallet = require('../models/wallet.model');
const BillingSession = require('../models/billingSession.model');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Import BillingEngine for unit tests
let BillingEngine;
try {
  const billingModule = require('../services/BillingEngine.js');
  BillingEngine = billingModule.BillingEngine || billingModule.default;
} catch (e) {
  console.log('BillingEngine module not available for testing:', e.message);
}

chai.use(chaiHttp);
const expect = chai.expect;

describe('Billing System', function() {
  this.timeout(30000); // Give tests more time for DB operations
  
  let testUser;
  let testAstrologer;
  let testAstrologerUser;
  let authToken;
  let clock;

  before(async () => {
    // Use a test-specific database collection suffix to avoid conflicts
    const testSuffix = uuidv4().slice(0, 8);
    
    // Clear test data with unique identifiers
    await User.deleteMany({ email: { $regex: /test.*@example\.com/ } });
    await Astrologer.deleteMany({});
    await Wallet.deleteMany({});
    await BillingSession.deleteMany({});

    // Create test user with unique email/username
    const uid = uuidv4().slice(0, 8);
    testUser = new User({
      name: 'Test User',
      username: `testuser_${uid}`,
      email: `testuser_${uid}@example.com`,
      password: 'hashedpassword123',
      avatar: 'https://example.com/avatar.jpg'
    });
    await testUser.save();

    // Create test astrologer user
    testAstrologerUser = new User({
      name: 'Test Astrologer',
      username: `testastrologer_${uid}`,
      email: `astrologer_${uid}@example.com`,
      password: 'hashedpassword123',
      avatar: 'https://example.com/astrologer.jpg',
      role: 'Astrologer'
    });
    await testAstrologerUser.save();

    // Create test astrologer profile
    testAstrologer = new Astrologer({
      userId: testAstrologerUser._id,
      specializations: [],
      languages: ['English'],
      experience: 5,
      costPerMinute: 30, // Legacy field
      ratePaisePerMin: 3000, // ₹30 per minute in paise
      ratePaisePerMinChat: 2500, // ₹25 per minute for chat
      ratePaisePerMinCall: 3500, // ₹35 per minute for calls
      about: 'Test astrologer',
      chatStatus: 'online',
      callStatus: 'online'
    });
    await testAstrologer.save();

    // Create wallet with sufficient balance
    const wallet = new Wallet({
      userId: testUser._id,
      balancePaise: 50000, // ₹500
      history: []
    });
    await wallet.save();

    // Generate auth token
    authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  after(async () => {
    // Safe cleanup with guards
    if (testUser?._id)            await User.findByIdAndDelete(testUser._id);
    if (testAstrologerUser?._id)  await User.findByIdAndDelete(testAstrologerUser._id);
    if (testAstrologer?._id)      await Astrologer.findByIdAndDelete(testAstrologer._id);
    await Wallet.deleteMany({ userId: testUser?._id });
    await BillingSession.deleteMany({ userId: testUser?._id });
    if (BillingEngine) {
      const be = new BillingEngine();
      await be.stopAllSessions();
    }
  });

  describe('BillingSession Model', () => {
    it('should create a billing session with correct default values', async () => {
      const session = new BillingSession({
        userId: testUser._id,
        astrologerId: testAstrologer._id,
        ratePaisePerMin: 3000,
        sessionType: 'chat'
      });

      await session.save();

      expect(session.secondsElapsed).to.equal(0);
      expect(session.live).to.be.true;
      expect(session.totalCostPaise).to.equal(0);
      expect(session.endedAt).to.be.null;

      await BillingSession.findByIdAndDelete(session._id);
    });

    it('should calculate current cost correctly', async () => {
      const session = new BillingSession({
        userId: testUser._id,
        astrologerId: testAstrologer._id,
        ratePaisePerMin: 3000, // ₹30/min
        sessionType: 'chat',
        secondsElapsed: 90 // 1.5 minutes
      });

      const cost = session.calculateCurrentCost();
      // Should be ceil(1.5 * 3000) = 4500 paise
      expect(cost).to.equal(4500);
    });

    it('should end session correctly', async () => {
      const session = new BillingSession({
        userId: testUser._id,
        astrologerId: testAstrologer._id,
        ratePaisePerMin: 3000,
        sessionType: 'chat',
        secondsElapsed: 120 // 2 minutes
      });

      await session.save();
      await session.endSession();

      expect(session.live).to.be.false;
      expect(session.endedAt).to.not.be.null;
      expect(session.totalCostPaise).to.equal(6000); // 2 * 3000 = 6000 paise
    });
  });

  describe('Billing API Endpoints', () => {
    let testSession;

    beforeEach(async () => {
      testSession = new BillingSession({
        userId: testUser._id,
        astrologerId: testAstrologer._id,
        ratePaisePerMin: 3000,
        sessionType: 'chat',
        secondsElapsed: 180, // 3 minutes
        totalCostPaise: 9000 // ₹90
      });
      await testSession.save();
    });

    afterEach(async () => {
      await BillingSession.findByIdAndDelete(testSession._id);
    });

    describe('GET /api/v1/billing/session/:id', () => {
      it('should return billing session receipt', async () => {
        const res = await chai
          .request(app)
          .get(`/api/v1/billing/session/${testSession._id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body.data).to.have.property('receipt');
        
        const receipt = res.body.data.receipt;
        expect(receipt.sessionId).to.equal(testSession._id.toString());
        expect(receipt.ratePaisePerMin).to.equal(3000);
        expect(receipt.durationMinutes).to.equal(3);
        expect(receipt.totalCostPaise).to.equal(9000);
        expect(receipt.costBreakdown.totalCost).to.equal('₹90.00');
      });

      it('should return 404 for non-existent session', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await chai
          .request(app)
          .get(`/api/v1/billing/session/${fakeId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res).to.have.status(404);
        expect(res.body).to.have.property('success', false);
      });

      it('should return 401 for unauthenticated request', async () => {
        const res = await chai
          .request(app)
          .get(`/api/v1/billing/session/${testSession._id}`);

        expect(res).to.have.status(401);
      });
    });

    describe('GET /api/v1/billing/history', () => {
      it('should return user billing history', async () => {
        const res = await chai
          .request(app)
          .get('/api/v1/billing/history')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body.data).to.have.property('history');
        expect(res.body.data.history).to.be.an('array');
        expect(res.body.data.pagination).to.exist;
      });

      it('should support pagination', async () => {
        const res = await chai
          .request(app)
          .get('/api/v1/billing/history?page=1&limit=5')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res).to.have.status(200);
        expect(res.body.data.pagination.currentPage).to.equal(1);
      });
    });
  });

  describe('Billing Engine Unit Tests', () => {
    let billingEngine;
    let mockSocket;

    beforeEach(() => {
      if (!BillingEngine) {
        return; // Skip if module not available
      }
      
      // Mock the tick interval to be shorter for testing
      process.env.TICK_SECONDS = '1';
      
      billingEngine = new BillingEngine();
      mockSocket = {
        emit: sinon.spy(),
        on: sinon.spy(),
        off: sinon.spy()
      };
    });

    afterEach(async () => {
      if (billingEngine) await billingEngine.stopAllSessions();
      if (clock) { 
        clock.restore(); 
        clock = null; 
      }
      delete process.env.TICK_SECONDS;
    });

    it('should start a billing session successfully', async function() {
      if (!BillingEngine) {
        this.skip();
        return;
      }

      const sessionConfig = {
        sessionId: '',
        userId: testUser._id.toString(),
        astrologerId: testAstrologer._id.toString(),
        ratePaisePerMin: 3000,
        sessionType: 'chat',
        socket: mockSocket
      };

      const sessionId = await billingEngine.startSession(sessionConfig);

      expect(sessionId).to.be.a('string');
      expect(sessionId).to.have.length.greaterThan(0);

      // Verify session was created in database
      const session = await BillingSession.findById(sessionId);
      expect(session).to.exist;
      expect(session.userId.toString()).to.equal(testUser._id.toString());
      expect(session.live).to.be.true;

      await billingEngine.stopSession(sessionId);
    });

    it('should process billing ticks correctly', async function() {
      if (!BillingEngine) {
        this.skip();
        return;
      }

      // Use a simpler approach that doesn't create infinite loops
      const sessionConfig = {
        sessionId: '',
        userId: testUser._id.toString(),
        astrologerId: testAstrologer._id.toString(),
        ratePaisePerMin: 3000, // ₹30/min = 50 paise per second
        sessionType: 'chat',
        socket: mockSocket
      };

      const sessionId = await billingEngine.startSession(sessionConfig);
      
      /* -----------------------------------------
         Wait until the first tick is **really** persisted.
         TICK_SECONDS is 1 s, so one write should land within ~1.2 s,
         but allow up to 5 × 1.2 s just in case the DB is slow.
      ----------------------------------------- */
      let session, wallet, retries = 0;
      do {
        await new Promise(r => setTimeout(r, 1200)); // 1.2 s
        session = await BillingSession.findById(sessionId).lean();
        wallet  = await Wallet.findOne({ userId: testUser._id }).lean();
        console.log(`Tick test retry ${retries + 1}: secondsElapsed=${session?.secondsElapsed}, balance=${wallet?.balancePaise}`);
      } while (session.secondsElapsed === 0 && ++retries < 5);

      // Verify at least one tick happened
      expect(session.secondsElapsed).to.be.above(0);
      expect(wallet.balancePaise).to.be.below(50000);

      // Now stop the session
      await billingEngine.stopSession(sessionId);
    });

    it('should prevent multiple active sessions for same user', async function() {
      if (!BillingEngine) {
        this.skip();
        return;
      }

      const sessionConfig = {
        sessionId: '',
        userId: testUser._id.toString(),
        astrologerId: testAstrologer._id.toString(),
        ratePaisePerMin: 3000,
        sessionType: 'chat',
        socket: mockSocket
      };

      const sessionId1 = await billingEngine.startSession(sessionConfig);
      
      // Try to start another session
      try {
        await billingEngine.startSession(sessionConfig);
        expect.fail('Should have thrown error for duplicate session');
      } catch (error) {
        expect(error.message).to.include('already has an active billing session');
      }

      await billingEngine.stopSession(sessionId1);
    });

    it('should handle session cleanup on stop', async function() {
      if (!BillingEngine) {
        this.skip();
        return;
      }

      const sessionConfig = {
        sessionId: '',
        userId: testUser._id.toString(),
        astrologerId: testAstrologer._id.toString(),
        ratePaisePerMin: 3000,
        sessionType: 'chat',
        socket: mockSocket
      };

      const sessionId = await billingEngine.startSession(sessionConfig);
      await billingEngine.stopSession(sessionId, 'test_ended');
      
      const session = await BillingSession.findById(sessionId);
      expect(session.live).to.be.false;
      expect(session.endedAt).to.not.be.null;
      expect(session.totalCostPaise).to.be.at.least(0);
    });
  });
}); 