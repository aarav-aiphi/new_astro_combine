const { billingEngine } = require('../../services/BillingEngine.js');
const Astrologer = require('../../models/astrologer.model');

function setupBillingHandlers(io, socket, onlineUsers) {
  console.log(`Setting up billing handlers for user: ${socket.user.id}`);

  /**
   * Start consultation and billing
   */
  socket.on('consult:start', async (data) => {
    try {
      console.log(`Consultation start request from user ${socket.user.id}:`, data);
      
      const { astrologerId, sessionType } = data;
      
      if (!astrologerId || !sessionType) {
        socket.emit('error', { message: 'Missing astrologerId or sessionType' });
        return;
      }

      // Get astrologer details and rate
      const astrologer = await Astrologer.findById(astrologerId);
      if (!astrologer) {
        socket.emit('error', { message: 'Astrologer not found' });
        return;
      }

      // Get the rate for the session type
      const ratePaisePerMin = sessionType === 'chat' 
        ? astrologer.ratePaisePerMinChat || astrologer.ratePaisePerMin 
        : astrologer.ratePaisePerMinCall || astrologer.ratePaisePerMin;

      if (!ratePaisePerMin) {
        socket.emit('error', { message: 'Rate not available for this session type' });
        return;
      }

      // Start billing session
      const sessionId = await billingEngine.startSession({
        sessionId: '', // Will be set by the engine
        userId: socket.user.id,
        astrologerId,
        ratePaisePerMin,
        sessionType,
        socket: socket
      });

      // Emit success response
      socket.emit('consult:started', {
        sessionId,
        astrologerId,
        sessionType,
        ratePaisePerMin,
        astrologerName: astrologer.name,
        tickInterval: parseInt(process.env.TICK_SECONDS || '15')
      });

      // Notify astrologer if online
      const astrologerSocket = Array.from(onlineUsers.values())
        .find(user => user.userId === astrologerId);
      
      if (astrologerSocket) {
        io.to(astrologerSocket.socketId).emit('consult:user-started', {
          sessionId,
          userId: socket.user.id,
          sessionType,
          ratePaisePerMin
        });
      }

      console.log(`Billing session ${sessionId} started for user ${socket.user.id} with astrologer ${astrologerId}`);

    } catch (error) {
      console.error('Error starting consultation:', error);
      socket.emit('error', { 
        message: 'Failed to start consultation',
        details: error.message 
      });
    }
  });

  /**
   * End consultation and billing
   */
  socket.on('consult:end', async (data) => {
    try {
      console.log(`Consultation end request from user ${socket.user.id}:`, data);
      
      const { sessionId, reason = 'user_ended' } = data;
      
      if (sessionId) {
        await billingEngine.stopSession(sessionId, reason);
      } else {
        // Find active session for this user
        const activeSession = await billingEngine.getActiveSession(socket.user.id);
        if (activeSession) {
          await billingEngine.stopSession(activeSession._id.toString(), reason);
        }
      }

      socket.emit('consult:ended', {
        sessionId,
        reason,
        timestamp: new Date()
      });

      console.log(`Consultation ended for user ${socket.user.id}, reason: ${reason}`);

    } catch (error) {
      console.error('Error ending consultation:', error);
      socket.emit('error', { 
        message: 'Failed to end consultation',
        details: error.message 
      });
    }
  });

  /**
   * Handle user-initiated session end (from End Session button)
   */
  socket.on('endSession', async (data) => {
    try {
      console.log(`End session request from user ${socket.user.id}:`, data);
      
      const { sessionId, reason = 'user_requested' } = data;
      
      // First get the active session details before stopping it
      let activeSessionData = null;
      if (sessionId) {
        // Get session details first
        const activeSession = await billingEngine.getActiveSession(socket.user.id);
        if (activeSession && activeSession._id.toString() === sessionId) {
          activeSessionData = {
            sessionId: activeSession._id.toString(),
            astrologerId: activeSession.astrologerId,
            userId: activeSession.userId
          };
        }
        await billingEngine.stopSession(sessionId, reason);
      } else {
        // Find active session for this user
        const activeSession = await billingEngine.getActiveSession(socket.user.id);
        if (activeSession) {
          activeSessionData = {
            sessionId: activeSession._id.toString(),
            astrologerId: activeSession.astrologerId,
            userId: activeSession.userId
          };
          await billingEngine.stopSession(activeSession._id.toString(), reason);
        } else {
          socket.emit('error', { message: 'No active session found to end' });
          return;
        }
      }

      // Notify the astrologer that the session has ended
      if (activeSessionData) {
        const astrologerSocket = Array.from(onlineUsers.values())
          .find(user => user.userId === activeSessionData.astrologerId);
        
        if (astrologerSocket) {
          io.to(astrologerSocket.socketId).emit('session:ended-by-user', {
            sessionId: activeSessionData.sessionId,
            userId: socket.user.id,
            reason: 'user_requested'
          });
        }
      }

      socket.emit('consult:ended', {
        sessionId: activeSessionData ? activeSessionData.sessionId : null,
        reason,
        timestamp: new Date()
      });

      console.log(`Session ended by user ${socket.user.id}, reason: ${reason}`);

    } catch (error) {
      console.error('Error ending session:', error);
      socket.emit('error', { 
        message: 'Failed to end session',
        details: error.message 
      });
    }
  });

  /**
   * Get current billing status
   */
  socket.on('billing:status', async () => {
    try {
      const activeSession = await billingEngine.getActiveSession(socket.user.id);
      
      if (activeSession) {
        const currentCost = activeSession.calculateCurrentCost();
        
        socket.emit('billing:status', {
          sessionId: activeSession._id,
          astrologerId: activeSession.astrologerId,
          sessionType: activeSession.sessionType,
          ratePaisePerMin: activeSession.ratePaisePerMin,
          secondsElapsed: activeSession.secondsElapsed,
          currentCostPaise: currentCost,
          isLive: activeSession.live,
          startedAt: activeSession.createdAt
        });
      } else {
        socket.emit('billing:status', { noActiveSession: true });
      }

    } catch (error) {
      console.error('Error getting billing status:', error);
      socket.emit('error', { 
        message: 'Failed to get billing status',
        details: error.message 
      });
    }
  });

  /**
   * Handle socket disconnect - stop any active billing
   */
  const originalDisconnect = socket.disconnect;
  socket.disconnect = async function(...args) {
    try {
      console.log(`User ${socket.user.id} disconnecting, checking for active billing sessions`);
      
      const activeSession = await billingEngine.getActiveSession(socket.user.id);
      if (activeSession) {
        console.log(`Stopping active billing session ${activeSession._id} due to disconnect`);
        await billingEngine.stopSession(activeSession._id.toString(), 'user_disconnected');
      }
    } catch (error) {
      console.error('Error handling billing on disconnect:', error);
    }
    
    return originalDisconnect.apply(this, args);
  };

  // Listen for billing engine events
  billingEngine.on('billing:tick', (tickData) => {
    if (tickData.userId === socket.user.id) {
      // Forward tick to user's socket
      socket.emit('billing:tick', tickData);
    }
  });

  billingEngine.on('session:stopped', (sessionData) => {
    if (sessionData.userId === socket.user.id) {
      socket.emit('billing:session-ended', {
        sessionId: sessionData.sessionId,
        totalCostPaise: sessionData.totalCostPaise,
        secondsElapsed: sessionData.secondsElapsed,
        reason: sessionData.reason
      });
    }
  });

  /* ---- prevent EventEmitter leaks ---- */
  socket.on('disconnect', () => {
    billingEngine.removeAllListeners('billing:tick');
    billingEngine.removeAllListeners('session:stopped');
  });

  console.log(`Billing handlers set up successfully for user: ${socket.user.id}`);
}

module.exports = setupBillingHandlers; 