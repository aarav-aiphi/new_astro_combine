const { EventEmitter } = require('events');
const BillingSession = require('../models/billingSession.model.js');
const Wallet = require('../models/wallet.model.js');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

class BillingEngine extends EventEmitter {
  constructor() {
    super();
    // TODO: Consider proper listener management instead of unlimited listeners
    // Avoid MaxListeners warnings; we'll clean up manually
    this.setMaxListeners(0);
    this.activeSessions = new Map();
    this.TICK_SECONDS = parseInt(process.env.TICK_SECONDS || '15');
    console.log(`BillingEngine initialized with ${this.TICK_SECONDS}s tick interval`);
  }

  /**
   * Start a billing session
   */
  async startSession(config) {
    try {
      console.log(`Starting billing session for user ${config.userId} with astrologer ${config.astrologerId}`);
      
      // Check if user has active session
      const existingSession = await BillingSession.findOne({
        userId: config.userId,
        live: true
      });

      if (existingSession) {
        throw new Error('User already has an active billing session');
      }

      // Create billing session
      const session = new BillingSession({
        userId: config.userId,
        astrologerId: config.astrologerId,
        ratePaisePerMin: config.ratePaisePerMin,
        sessionType: config.sessionType,
        secondsElapsed: 0,
        live: true
      });

      await session.save();
      
      // Start the billing timer
      const intervalId = setInterval(async () => {
        await this.processTick(session._id.toString(), config.socket);
      }, this.TICK_SECONDS * 1000);

      this.activeSessions.set(session._id.toString(), intervalId);
      
      // Emit session started event
      this.emit('session:started', {
        sessionId: session._id.toString(),
        userId: config.userId,
        astrologerId: config.astrologerId
      });

      console.log(`Billing session ${session._id} started successfully`);
      return session._id.toString();

    } catch (error) {
      console.error('Error starting billing session:', error);
      throw error;
    }
  }

  /**
   * Stop a billing session
   */
  async stopSession(sessionId, reason = 'user_ended') {
    try {
      console.log(`Stopping billing session ${sessionId}, reason: ${reason}`);
      
      // Clear the interval
      const intervalId = this.activeSessions.get(sessionId);
      if (intervalId) {
        clearInterval(intervalId);
        this.activeSessions.delete(sessionId);
      }

      // Update session in database
      const session = await BillingSession.findById(sessionId);
      if (session && session.live) {
        await session.endSession();
        
        // Emit session stopped event
        this.emit('session:stopped', {
          sessionId,
          userId: session.userId.toString(),
          astrologerId: session.astrologerId.toString(),
          totalCostPaise: session.totalCostPaise,
          secondsElapsed: session.secondsElapsed,
          reason
        });

        console.log(`Billing session ${sessionId} stopped. Total cost: ${session.totalCostPaise} paise`);
      }
    } catch (error) {
      console.error('Error stopping billing session:', error);
      throw error;
    }
  }

  /**
   * Process billing tick with atomic transaction
   */
  async processTick(sessionId, socket) {
    const mongoSession = await mongoose.startSession();
    
    try {
      mongoSession.startTransaction();
      
      const sessionDoc = await BillingSession.findById(sessionId).session(mongoSession);
      if (!sessionDoc || !sessionDoc.live) {
        console.log(`Session ${sessionId} is no longer active, stopping tick`);
        await mongoSession.abortTransaction();
        await this.stopSession(sessionId, 'session_ended');
        return;
      }

      // Verify that the user being charged is actually a User role, not Astrologer
      const User = require('../models/user.model');
      const userToCharge = await User.findById(sessionDoc.userId);
      if (!userToCharge || userToCharge.role.toLowerCase() !== 'user') {
        console.log(`⚠️  Session ${sessionId} is charging user ${sessionDoc.userId} with role ${userToCharge?.role || 'NOT FOUND'} - stopping session`);
        await mongoSession.abortTransaction();
        await this.stopSession(sessionId, 'invalid_user_role');
        return;
      }

      // Calculate deduction amount based on actual tick interval
      const deductionPaise = Math.ceil(
        sessionDoc.ratePaisePerMin * this.TICK_SECONDS / 60
      );
      
      // Cast the user id so the update predicate actually matches
      const userOid = new mongoose.Types.ObjectId(sessionDoc.userId);
      
      // Atomic wallet update with balance check
      const wallet = await Wallet.findOneAndUpdate(
        { 
          userId: userOid, 
          balancePaise: { $gte: deductionPaise } 
        },
        { 
          $inc: { balancePaise: -deductionPaise },
          $push: { 
            history: {
              type: 'debit',
              amountPaise: deductionPaise,
              description: `Consult billing – ${this.TICK_SECONDS}s`,
              transactionId: uuidv4(),
              timestamp: new Date()
            }
          }
        },
        { new: true, session: mongoSession }   // return the up-to-date doc
      );

      // Check if wallet update succeeded (sufficient balance)
      if (!wallet) {
        console.log(`Insufficient balance for session ${sessionId}`);
        
        // Get current balance for warning
        const walletForWarning = await Wallet.findOne({ userId: userOid });
        const currentBalance = walletForWarning?.balancePaise || 0;
        
        // Emit low balance warning
        socket.emit('billing:low-balance', {
          sessionId,
          balancePaise: currentBalance,
          requiredPaise: deductionPaise,
          message: `Insufficient balance. Current: ₹${(currentBalance/100).toFixed(0)}, Required: ₹${(deductionPaise/100).toFixed(0)}`,
          graceTimeSeconds: 30
        });

        // Abort transaction and schedule session end
        await mongoSession.abortTransaction();
        
        // Wait 30 seconds then end consultation
        setTimeout(async () => {
          socket.emit('consult:end', { 
            reason: 'insufficient_balance',
            sessionId 
          });
          await this.stopSession(sessionId, 'insufficient_balance');
        }, 30000);
        
        return;
      }

      // Credit astrologer wallet inside the same transaction
      const astrologerWallet = await Wallet.updateOne(
        { userId: sessionDoc.astrologerId },
        { 
          $inc: { balancePaise: deductionPaise },
          $push: { 
            history: {
              type: 'credit',
              amountPaise: deductionPaise,
              description: `Consultation earnings – ${this.TICK_SECONDS}s`,
              transactionId: uuidv4(),
              timestamp: new Date()
            }
          }
        },
        { session: mongoSession }
      );

      // Update session elapsed time
      sessionDoc.secondsElapsed += this.TICK_SECONDS;
      await sessionDoc.save({ session: mongoSession });

      // Commit transaction
      await mongoSession.commitTransaction();
      
      // Create tick data
      const tickData = {
        sessionId,
        userId: sessionDoc.userId.toString(),
        astrologerId: sessionDoc.astrologerId.toString(),
        secondsElapsed: sessionDoc.secondsElapsed,
        balancePaise: wallet.balancePaise,   // ← already fresh
        deductedPaise: deductionPaise
      };

      // Emit billing tick event
      socket.emit('billing:tick', tickData);
      this.emit('billing:tick', tickData);

      // Emit astrologer credit event (optional)
      socket.emit('billing:astrologer-credit', {
        sessionId,
        astrologerId: sessionDoc.astrologerId.toString(),
        creditedPaise: deductionPaise
      });

      console.log(`Billing tick processed for session ${sessionId}: ${deductionPaise} paise deducted from user, credited to astrologer, ${wallet.balancePaise} remaining`);

    } catch (error) {
      console.error(`Error processing tick for session ${sessionId}:`, error);
      await mongoSession.abortTransaction();
      await this.stopSession(sessionId, 'processing_error');
    } finally {
      await mongoSession.endSession();
    }
  }

  /**
   * Get active session for user
   */
  async getActiveSession(userId) {
    return await BillingSession.findOne({
      userId,
      live: true
    }).populate('astrologerId', 'name specializations');
  }

  /**
   * Get next tick cost for user session
   * @param {string} userId - User ID to check
   * @returns {Promise<Object>} - { ok: boolean, deductionPaise: number, balancePaise: number }
   */
  async getNextTickCost(userId) {
    try {
      // Get active session
      const activeSession = await this.getActiveSession(userId);
      
      if (!activeSession) {
        return {
          ok: true,
          deductionPaise: 0,
          balancePaise: 0,
          message: 'No active session'
        };
      }

      // Calculate deduction amount
      const deductionPaise = Math.ceil(
        activeSession.ratePaisePerMin * this.TICK_SECONDS / 60
      );

      // Get current wallet balance - handle both ObjectId and string formats
      let userOid;
      try {
        userOid = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
      } catch (e) {
        userOid = userId; // Use as-is if conversion fails
      }
      
      const wallet = await Wallet.findOne({ userId: userOid }, 'balancePaise');
      const balancePaise = wallet?.balancePaise ?? 0;

      // Check if balance is sufficient
      const ok = balancePaise >= deductionPaise;

      return {
        ok,
        deductionPaise,
        balancePaise,
        message: ok ? 'Sufficient balance' : 'Insufficient balance'
      };

    } catch (error) {
      console.error('Error in getNextTickCost:', error);
      return {
        ok: false,
        deductionPaise: 0,
        balancePaise: 0,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Force stop all sessions for emergency
   */
  async stopAllSessions() {
    console.log('Emergency stop: stopping all active billing sessions');
    
    for (const [sessionId] of this.activeSessions) {
      await this.stopSession(sessionId, 'emergency_stop');
    }
    
    // Also stop any sessions that might be live in DB but not in memory
    const liveSessions = await BillingSession.find({ live: true });
    for (const session of liveSessions) {
      await session.endSession();
    }
  }

  /**
   * Get billing statistics
   */
  getStats() {
    return {
      activeSessions: this.activeSessions.size,
      tickInterval: this.TICK_SECONDS
    };
  }

  // Redis adapter methods (skeleton for future implementation)
  
  /**
   * Publish session event to Redis for cluster coordination
   * TODO: Implement when Redis clustering is enabled
   */
  publishToRedis(event, data) {
    // TODO: Implement Redis pub/sub
    // redis.publish(`billing:${event}`, JSON.stringify(data));
    console.log(`TODO: Publish to Redis - ${event}:`, data);
  }

  /**
   * Subscribe to Redis events from other workers
   * TODO: Implement when Redis clustering is enabled
   */
  subscribeToRedis() {
    // TODO: Implement Redis subscription
    // redis.subscribe('billing:session:start', 'billing:session:stop');
    // redis.on('message', (channel, message) => { ... });
    console.log('TODO: Subscribe to Redis billing events');
  }

  /**
   * Handle billing events from other cluster workers
   * TODO: Implement when Redis clustering is enabled
   */
  handleRemoteEvent(event, data) {
    // TODO: Handle events from other workers
    console.log(`TODO: Handle remote event - ${event}:`, data);
  }
}

// Export singleton instance
const billingEngine = new BillingEngine();

// TODO: Redis adapter for cluster-wide session events and LB sticky-sessions.

module.exports = { billingEngine, BillingEngine }; 