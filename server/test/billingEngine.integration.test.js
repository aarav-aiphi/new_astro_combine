const { expect } = require('chai');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { BillingEngine } = require('../services/BillingEngine.js');
const Wallet = require('../models/wallet.model.js');
const BillingSession = require('../models/billingSession.model.js');
const User = require('../models/user.model.js');

describe('BillingEngine Integration Tests', function() {
  this.timeout(30000);
  
  let billingEngine;
  let testUser;
  let testAstrologer;
  let mockSocket;
  let emittedEvents;

  before(async () => {
    // Initialize billing engine
    billingEngine = new BillingEngine();
    
    // Setup mock socket to capture emitted events
    emittedEvents = [];
    mockSocket = {
      emit: (event, data) => {
        emittedEvents.push({ event, data });
      }
    };
    
    // Drop the old index if it exists and rebuild with partial index
    try {
      await Wallet.collection.dropIndex('history.transactionId_1');
      console.log('Dropped old transactionId index');
    } catch (error) {
      // Index might not exist, that's fine
      if (error.code !== 27) {
        console.log('Error dropping index:', error.message);
      }
    }
    
    // Ensure the partial index is built in the in-memory MongoDB
    await Wallet.init();
  });

  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await BillingSession.deleteMany({});
    emittedEvents = [];
    
    // Wait a bit for MongoDB to fully clean up indexes
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create test user
    testUser = new User({
      name: 'Test User',
      username: `testuser_${uuidv4().slice(0, 8)}`,
      email: `testuser_${uuidv4().slice(0, 8)}@example.com`,
      password: 'hashedpassword123',
      role: 'User'
    });
    await testUser.save();

    // Create test astrologer
    testAstrologer = new User({
      name: 'Test Astrologer',
      username: `testastrologer_${uuidv4().slice(0, 8)}`,
      email: `astrologer_${uuidv4().slice(0, 8)}@example.com`,
      password: 'hashedpassword123',
      role: 'Astrologer'
    });
    await testAstrologer.save();
  });

  afterEach(async () => {
    // Stop all sessions after each test
    await billingEngine.stopAllSessions();
  });

  after(async () => {
    // Final cleanup
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await BillingSession.deleteMany({});
  });

  describe('processTick() Integration', () => {
    it('should correctly debit user and credit astrologer with ObjectId casting', async () => {
             // Setup: Create wallets with initial balances
       const userWallet = new Wallet({
         userId: testUser._id, // This is already an ObjectId
         balancePaise: 6000 // ₹60
         // Don't initialize empty history array to avoid transactionId conflicts
       });
      await userWallet.save();

             const astrologerWallet = new Wallet({
         userId: testAstrologer._id, // This is already an ObjectId
         balancePaise: 0
       });
      await astrologerWallet.save();

      // Create billing session with rate 1200 paise/min (₹12/min)
      const billingSession = new BillingSession({
        userId: testUser._id.toString(), // ⚠️ This simulates the string storage issue
        astrologerId: testAstrologer._id,
        ratePaisePerMin: 1200, // ₹12 per minute
        sessionType: 'chat',
        secondsElapsed: 0,
        live: true
      });
      await billingSession.save();

      // Calculate expected deduction for default 15-second tick
      // (1200 paise/min * 15 seconds) / 60 = 300 paise
      const expectedDeduction = Math.ceil((1200 * 15) / 60); // 300 paise

      // Execute: Process one billing tick
      await billingEngine.processTick(billingSession._id.toString(), mockSocket);

      // Verify: Check wallet balances after tick
      const updatedUserWallet = await Wallet.findOne({ userId: testUser._id });
      const updatedAstrologerWallet = await Wallet.findOne({ userId: testAstrologer._id });
      const updatedSession = await BillingSession.findById(billingSession._id);

      // Assert: User wallet should be debited
      expect(updatedUserWallet.balancePaise).to.equal(6000 - expectedDeduction); // 5700
      expect(updatedUserWallet.history).to.have.length(1);
      expect(updatedUserWallet.history[0].type).to.equal('debit');
      expect(updatedUserWallet.history[0].amountPaise).to.equal(expectedDeduction);

      // Assert: Astrologer wallet should be credited
      expect(updatedAstrologerWallet.balancePaise).to.equal(expectedDeduction); // 300
      expect(updatedAstrologerWallet.history).to.have.length(1);
      expect(updatedAstrologerWallet.history[0].type).to.equal('credit');
      expect(updatedAstrologerWallet.history[0].amountPaise).to.equal(expectedDeduction);

      // Assert: Session should be updated
      expect(updatedSession.secondsElapsed).to.equal(15);
      expect(updatedSession.live).to.be.true;

      // Assert: Correct events were emitted
      const billingTickEvent = emittedEvents.find(e => e.event === 'billing:tick');
      expect(billingTickEvent).to.exist;
      expect(billingTickEvent.data.sessionId).to.equal(billingSession._id.toString());
      expect(billingTickEvent.data.userId).to.equal(testUser._id.toString());
      expect(billingTickEvent.data.astrologerId).to.equal(testAstrologer._id.toString());
      expect(billingTickEvent.data.balancePaise).to.equal(5700); // Fresh balance
      expect(billingTickEvent.data.deductedPaise).to.equal(expectedDeduction);
      expect(billingTickEvent.data.secondsElapsed).to.equal(15);

      const astrologerCreditEvent = emittedEvents.find(e => e.event === 'billing:astrologer-credit');
      expect(astrologerCreditEvent).to.exist;
      expect(astrologerCreditEvent.data.creditedPaise).to.equal(expectedDeduction);
    });

    it('should handle insufficient balance correctly', async () => {
       const userWallet = new Wallet({
         userId: testUser._id,
         balancePaise: 100 // Only ₹1 - insufficient for ₹3 deduction
       });
      await userWallet.save();

             const astrologerWallet = new Wallet({
         userId: testAstrologer._id,
         balancePaise: 0
       });
      await astrologerWallet.save();

      // Create billing session with high rate
      const billingSession = new BillingSession({
        userId: testUser._id.toString(), // String to test ObjectId casting
        astrologerId: testAstrologer._id,
        ratePaisePerMin: 1200, // Requires 300 paise for 15s tick
        sessionType: 'chat',
        secondsElapsed: 0,
        live: true
      });
      await billingSession.save();

      // Execute: Process billing tick
      await billingEngine.processTick(billingSession._id.toString(), mockSocket);

      // Verify: Wallets should be unchanged due to insufficient balance
      const updatedUserWallet = await Wallet.findOne({ userId: testUser._id });
      const updatedAstrologerWallet = await Wallet.findOne({ userId: testAstrologer._id });

      expect(updatedUserWallet.balancePaise).to.equal(100); // Unchanged
      expect(updatedAstrologerWallet.balancePaise).to.equal(0); // Unchanged

      // Verify: Low balance warning was emitted
      const lowBalanceEvent = emittedEvents.find(e => e.event === 'billing:low-balance');
      expect(lowBalanceEvent).to.exist;
      expect(lowBalanceEvent.data.sessionId).to.equal(billingSession._id.toString());
      expect(lowBalanceEvent.data.balancePaise).to.equal(100);
      expect(lowBalanceEvent.data.requiredPaise).to.equal(300);
      expect(lowBalanceEvent.data.graceTimeSeconds).to.equal(30);

      // Verify: No billing:tick event should be emitted
      const billingTickEvent = emittedEvents.find(e => e.event === 'billing:tick');
      expect(billingTickEvent).to.not.exist;
    });

    it('should use fresh wallet balance in emitted tick data', async () => {
             // Setup: Create wallet
       const userWallet = new Wallet({
         userId: testUser._id,
         balancePaise: 5000
       });
      await userWallet.save();

             const astrologerWallet = new Wallet({
         userId: testAstrologer._id,
         balancePaise: 1000 // Starting with some balance
       });
      await astrologerWallet.save();

      // Create billing session
      const billingSession = new BillingSession({
        userId: testUser._id.toString(),
        astrologerId: testAstrologer._id,
        ratePaisePerMin: 2400, // ₹24/min -> 600 paise for 15s
        sessionType: 'chat',
        secondsElapsed: 30, // Already 30 seconds elapsed
        live: true
      });
      await billingSession.save();

      // Execute: Process tick
      await billingEngine.processTick(billingSession._id.toString(), mockSocket);

      // Verify: Emitted data contains fresh balance
      const billingTickEvent = emittedEvents.find(e => e.event === 'billing:tick');
      expect(billingTickEvent).to.exist;
      
      const expectedDeduction = Math.ceil((2400 * 15) / 60); // 600 paise
      const expectedBalance = 5000 - expectedDeduction; // 4400 paise
      
      expect(billingTickEvent.data.balancePaise).to.equal(expectedBalance);
      expect(billingTickEvent.data.deductedPaise).to.equal(expectedDeduction);
      expect(billingTickEvent.data.secondsElapsed).to.equal(45); // 30 + 15

      // Double-check the actual wallet balance matches
      const finalUserWallet = await Wallet.findOne({ userId: testUser._id });
      expect(finalUserWallet.balancePaise).to.equal(expectedBalance);
    });
  });
}); 