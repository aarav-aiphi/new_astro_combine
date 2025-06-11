const walletService = require('../../utils/wallet.service');
const User = require('../../models/user.model');
const checkBalance = require('./middleware/checkBalance');

module.exports = function setupCallHandlers(io, socket, onlineUsers) {
    // =============== CALL EVENTS ===============
    
    // Track current session for WebRTC disconnect handling
    let currentSessionId = null;
    
    socket.on('callUser', async ({ recipientId, signalData, callType, callerName }) => {
      console.log(`Call initiated by ${socket.user.id} to ${recipientId}`);

      // Check balance before allowing call initiation
      const hasPermission = await checkBalance(socket);
      if (!hasPermission) {
        console.log('Call blocked due to insufficient balance');
        socket.emit('callError', { 
          message: 'Insufficient balance. Please recharge to continue calling.' 
        });
        return;
      }
  
      const recipientSocket = [...onlineUsers.values()]
        .find(u => u.userId === recipientId)?.socketId;
  
      // Check if the caller is a user and the recipient is an astrologer
      if (socket.user.role === 'User') {
        try {
          // Check user's wallet balance before allowing call
          const walletBalance = await walletService.getWalletBalance(socket.user.id);
          
          // Get the astrologer's rate to check if user has enough for at least 1 minute
          const recipient = await User.findById(recipientId);
          if (!recipient || recipient.role !== 'Astrologer') {
            socket.emit('callError', { message: 'Recipient is not an astrologer' });
            return;
          }
          
          // Check if user has enough balance for at least 1 minute
          try {
            const hasBalance = await walletService.hasSufficientBalance(
              socket.user.id, 
              1, // 1 minute minimum
              recipient.costPerMinute || 10 // Default to 10 if not set
            );
            
            if (!hasBalance) {
              socket.emit('callError', { message: 'Insufficient balance for a call' });
              return;
            }
          } catch (error) {
            socket.emit('callError', { message: error.message });
            return;
          }
        } catch (error) {
          console.error('Error checking wallet balance:', error);
          socket.emit('callError', { message: 'Failed to check wallet balance' });
          return;
        }
      }
  
      if (recipientSocket) {
        io.to(recipientSocket).emit('incomingCall', {
          callerId: socket.user.id,
          callerName,
          signalData,
          callType
        });
      }
    });
  
    socket.on('answerCall', async ({ callerId, signalData }) => {
      console.log("[Server] answerCall =>", callerId);
      const callerSocket = [...onlineUsers.values()]
        .find(u => u.userId === callerId)?.socketId;
  
      if (callerSocket) {
        io.to(callerSocket).emit('callAccepted', signalData);
        
        // When a call is accepted, create a new session
        try {
          // Determine which user is the astrologer and which is the regular user
          const caller = await User.findById(callerId);
          if (!caller) return;
          
          let userId, astrologerId;
          
          if (caller.role === 'User') {
            userId = callerId;
            astrologerId = socket.user.id;
          } else if (caller.role === 'Astrologer') {
            userId = socket.user.id;
            astrologerId = callerId;
          } else {
            // Handle case where neither is an astrologer (shouldn't happen)
            return;
          }
          
          // Create a call session
          const session = await walletService.createSession(userId, astrologerId, 'call');
          
          // Emit to both users
          io.to(callerSocket).emit('sessionStarted', {
            sessionId: session._id,
            startTime: session.startTime,
            ratePerMinute: session.ratePerMinute
          });
          
          io.to(socket.id).emit('sessionStarted', {
            sessionId: session._id,
            startTime: session.startTime,
            ratePerMinute: session.ratePerMinute
          });
          
          console.log(`Call session ${session._id} started between ${userId} and ${astrologerId}`);
        } catch (error) {
          console.error('Error creating call session:', error);
          io.to(callerSocket).emit('callError', { message: 'Failed to create call session' });
          io.to(socket.id).emit('callError', { message: 'Failed to create call session' });
        }
      }
    });
  
    socket.on("rejectCall", ({ callerId }) => {
      console.log("[Server] rejectCall =>", callerId);
      const callerSocket = [...onlineUsers.values()]
        .find(u => u.userId === callerId)?.socketId;
  
      if (callerSocket) {
        io.to(callerSocket).emit('callRejected');
      }
    });
  
    socket.on("endCall", async ({ sessionId }) => {
      console.log("[Server] endCall from", socket.user.id);
      
      // Clear current session tracking
      currentSessionId = null;
      
      try {
        if (sessionId) {
          // End the session and process payment
          const { session, transaction } = await walletService.endSession(sessionId);
          
          // Find the other party in the call
          const otherPartyId = socket.user.id === session.userId.toString() 
            ? session.astrologerId.toString() 
            : session.userId.toString();
          
          const otherPartySocket = [...onlineUsers.values()]
            .find(u => u.userId === otherPartyId)?.socketId;
          
          // Send session end details to both parties
          const sessionEndDetails = {
            sessionId: session._id,
            duration: session.duration,
            cost: transaction.amount,
            endTime: session.endTime
          };
          
          socket.emit('sessionEnded', sessionEndDetails);
          
          if (otherPartySocket) {
            io.to(otherPartySocket).emit('sessionEnded', sessionEndDetails);
          }
        }
      } catch (error) {
        console.error('Error ending call session:', error);
      }
      
      // Broadcast call ended to all users (keeping existing behavior)
      socket.broadcast.emit("callEnded");
    });
  
    // Check wallet balance during call
    socket.on('checkWalletBalance', async (callback) => {
      try {
        const balance = await walletService.getWalletBalance(socket.user.id);
        
        if (callback) {
          callback({
            success: true,
            balance
          });
        }
      } catch (error) {
        console.error('Error checking wallet balance:', error);
        if (callback) {
          callback({
            success: false,
            error: error.message
          });
        }
      }
    });

    // Handle WebRTC connection state changes (client-side implementation)
    socket.on('webrtc:connectionState', ({ state, sessionId }) => {
      if (['failed', 'disconnected', 'closed'].includes(state)) {
        console.log(`WebRTC connection ${state} for session ${sessionId}, ending consultation`);
        socket.emit('consult:end', { sessionId, reason: 'webrtc_disconnect' });
      }
    });

    // Track session for WebRTC monitoring
    socket.on('session:track', ({ sessionId }) => {
      currentSessionId = sessionId;
      console.log(`Tracking session ${sessionId} for WebRTC disconnect handling`);
    });
  };
  