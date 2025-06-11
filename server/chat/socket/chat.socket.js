const Chat = require('../models/chat.model');
const { generateSummary } = require('../utils/ai');
const User = require('../../models/user.model');
const mongoose = require('mongoose');
const walletService = require('../../utils/wallet.service');
const checkBalance = require('./middleware/checkBalance');

module.exports = function setupChatHandlers(io, socket, onlineUsers) {

  // Join Room
  socket.on('joinRoom', async ({ chatId }) => {
    socket.join(chatId);
    console.log(`🏠 User ${socket.user.id} joined room ${chatId} - checking billing setup`);

    // Get the chat to determine user and astrologer
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      const isUser = socket.user.id.toString() === chat.userId.toString();
      const isAstrologer = socket.user.id.toString() === chat.astrologerId.toString();
      
      // Only start billing when a user joins (to avoid duplicate sessions)
      // Also verify that the person joining is actually a User role, not Astrologer
      if (isUser && socket.user.role && socket.user.role.toLowerCase() === 'user') {
        // Import BillingEngine here to use the new system
        const { billingEngine } = require('../../services/BillingEngine.js');
        const Astrologer = require('../../models/astrologer.model.js');
        
        try {
          // Check if there's already an active billing session for the USER (not whoever joins)
          const activeSession = await billingEngine.getActiveSession(chat.userId.toString());
          
          if (!activeSession) {
            // Get astrologer details and rate
            // First try by _id, then by userId for compatibility
            let astrologer = await Astrologer.findById(chat.astrologerId);
            if (!astrologer) {
              astrologer = await Astrologer.findOne({ userId: chat.astrologerId });
            }
            if (!astrologer) {
              socket.emit('errorMessage', { message: 'Astrologer not found' });
              return;
            }

            // Get the rate for chat consultation
            const ratePaisePerMin = astrologer.ratePaisePerMinChat || astrologer.ratePaisePerMin;
            if (!ratePaisePerMin) {
              socket.emit('errorMessage', { message: 'Rate not available for chat consultation' });
              return;
            }

            // Start billing session using the new BillingEngine
            // IMPORTANT: Always charge the USER (chat.userId), not whoever joins the room
            const sessionId = await billingEngine.startSession({
              userId: chat.userId.toString(),
              astrologerId: chat.astrologerId.toString(),
              ratePaisePerMin,
              sessionType: 'chat',
              socket: socket
            });

            // Emit consultation started event (matches new billing system)
            io.to(chatId).emit('consult:started', {
              sessionId,
              astrologerId: chat.astrologerId.toString(),
              sessionType: 'chat',
              ratePaisePerMin,
              astrologerName: astrologer.name,
              tickInterval: parseInt(process.env.TICK_SECONDS || '15')
            });
            
            console.log(`✅ Chat billing session ${sessionId} started for chat ${chatId} using BillingEngine - Rate: ${ratePaisePerMin} paise/min`);
          } else {
            // If there's an existing session, inform the clients
            // Add null checks for activeSession fields
            if (activeSession._id && activeSession.astrologerId && activeSession.ratePaisePerMin) {
              io.to(chatId).emit('consult:started', {
                sessionId: activeSession._id.toString(),
                astrologerId: activeSession.astrologerId.toString(),
                sessionType: 'chat',
                ratePaisePerMin: activeSession.ratePaisePerMin,
                astrologerName: 'Active Session',
                tickInterval: parseInt(process.env.TICK_SECONDS || '15')
              });
              console.log(`♻️  Existing billing session found for user ${chat.userId}`);
            } else {
              console.warn('⚠️  Active session found but missing required fields:', {
                sessionId: activeSession._id,
                astrologerId: activeSession.astrologerId,
                ratePaisePerMin: activeSession.ratePaisePerMin
              });
              
              // Try to start a new session since the existing one is invalid
              // Get astrologer details and rate
              let astrologer = await Astrologer.findById(chat.astrologerId);
              if (!astrologer) {
                astrologer = await Astrologer.findOne({ userId: chat.astrologerId });
              }
              if (!astrologer) {
                socket.emit('errorMessage', { message: 'Astrologer not found' });
                return;
              }

              const ratePaisePerMin = astrologer.ratePaisePerMinChat || astrologer.ratePaisePerMin;
              if (!ratePaisePerMin) {
                socket.emit('errorMessage', { message: 'Rate not available for chat consultation' });
                return;
              }

              // Start billing session using the new BillingEngine
              // IMPORTANT: Always charge the USER (chat.userId), not whoever joins the room
              const sessionId = await billingEngine.startSession({
                userId: chat.userId.toString(),
                astrologerId: chat.astrologerId.toString(),
                ratePaisePerMin,
                sessionType: 'chat',
                socket: socket
              });

              io.to(chatId).emit('consult:started', {
                sessionId,
                astrologerId: chat.astrologerId.toString(),
                sessionType: 'chat',
                ratePaisePerMin,
                astrologerName: astrologer.name,
                tickInterval: parseInt(process.env.TICK_SECONDS || '15')
              });
              
              console.log(`✅ New billing session ${sessionId} started after invalid existing session`);
            }
          }
        } catch (error) {
          console.error('Error starting billing session:', error);
          socket.emit('errorMessage', {
            message: 'Failed to start chat session',
            error: error.message
          });
        }
      }
    } catch (error) {
      console.error('Error in joinRoom:', error);
    }
  });

  // Send Message
  socket.on("sendMessage", async ({ chatId, message, replyTo }, callback) => {
    console.log('SERVER RECEIVED MESSAGE REQUEST:', { chatId, message, userId: socket.user?.id });
    try {
      // Check balance before allowing message (for users, not astrologers)
      const hasPermission = await checkBalance(socket);
      if (!hasPermission) {
        console.log('Message blocked due to insufficient balance');
        if (callback) callback({ 
          success: false, 
          error: 'Insufficient balance. Please recharge to continue messaging.' 
        });
        return;
      }

      // Validate input
      if (!chatId || !message) {
        console.log('Missing chatId or message', { chatId, message });
        if (callback) callback({ success: false, error: 'Invalid message data' });
        return;
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        console.log(`Chat not found with ID: ${chatId}`);
        if (callback) callback({ success: false, error: 'Chat not found' });
        return;
      }

      // Debug chat details
      console.log('CHAT DETAILS:', { 
        chatId: chat._id.toString(),
        userId: chat.userId.toString(),
        astrologerId: chat.astrologerId.toString(),
        socketUserId: socket.user.id
      });

      // Verify user has access to this chat
      const userIdStr = socket.user.id.toString();
      const chatUserIdStr = chat.userId.toString();
      const chatAstrologerIdStr = chat.astrologerId.toString();
      
      console.log('Comparing IDs:', {
        userIdStr,
        chatUserIdStr,
        chatAstrologerIdStr,
        isUser: userIdStr === chatUserIdStr,
        isAstrologer: userIdStr === chatAstrologerIdStr
      });
      
      if (userIdStr !== chatUserIdStr && userIdStr !== chatAstrologerIdStr) {
        console.log('Access denied - user not part of chat', {
          chatUserId: chatUserIdStr,
          chatAstrologerId: chatAstrologerIdStr,
          socketUserId: userIdStr
        });
        if (callback) callback({ success: false, error: 'Access denied' });
        return;
      }

      // Note: Balance checking is now handled by the BillingEngine's processTick method
      // which runs every 15 seconds and automatically handles low balance warnings

      const user = await User.findById(socket.user.id).select('name avatar');
      if (!user) {
        console.log(`User not found with ID: ${socket.user.id}`);
        if (callback) callback({ success: false, error: 'User not found' });
        return;
      }

      const newMessage = {
        _id: new mongoose.Types.ObjectId(),
        sender: socket.user.id,
        content: message,
        type: "text",
        reactions: new Map(),
        replyTo: replyTo || null,  // This stores just the message ID
        createdAt: new Date()
      };

      chat.messages.push(newMessage);
      await chat.save();

      const savedMessage = chat.messages[chat.messages.length - 1];

      // Get replied message details
      let replyToPayload = null;
      if (savedMessage.replyTo) {
        // Find the original message in chat history
        const originalMessage = chat.messages.find(msg =>
          msg._id.equals(savedMessage.replyTo)
        );

        if (originalMessage) {
          // Get sender info of original message
          const originalSender = await User.findById(originalMessage.sender)
            .select('name avatar');

          replyToPayload = {
            _id: originalMessage._id,
            content: originalMessage.content,
            sender: {
              _id: originalSender._id,
              name: originalSender.name,
              avatar: originalSender.avatar
            }
          };
        }
      }

      // Construct final message payload
      const messagePayload = {
        _id: savedMessage._id,
        sender: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar
        },
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
        type: savedMessage.type,
        replyTo: replyToPayload,  // Use the properly populated payload
        reactions: {}
      };

      // Emit to all clients in the chat room
      console.log('Emitting newMessage event to room:', chatId, 'with payload:', { 
        messageId: messagePayload._id.toString(),
        content: messagePayload.content
      });
      
      io.to(chatId).emit("newMessage", { chatId, message: messagePayload });

      // Check if callback exists before calling
      if (callback) {
        console.log('Sending success callback');
        callback({
          success: true,
          message: messagePayload
        });
      }

    } catch (error) {
      console.error("Error in sendMessage:", error);
      if (callback) callback({ success: false, error: error.message }); // Add callback check
    }
  });

  // Leave Chat (End Session)
  socket.on('leaveChat', async ({ chatId }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return;
      
      const userId = socket.user.id.toString();
      const isUser = userId === chat.userId.toString();
      const isAstrologer = userId === chat.astrologerId.toString();
      
      if (!isUser && !isAstrologer) return;
      
      // Only users can end billing sessions (astrologers don't control billing)
      if (isUser) {
        const { billingEngine } = require('../../services/BillingEngine.js');
        
        // Find the active billing session
        const activeSession = await billingEngine.getActiveSession(userId);
        
        if (activeSession) {
          // End the billing session using BillingEngine
          await billingEngine.stopSession(activeSession._id.toString(), 'user_ended');
          
          // Emit consultation ended event (matches new billing system)
          io.to(chatId).emit('consult:ended', {
            sessionId: activeSession._id.toString(),
            reason: 'user_ended',
            timestamp: new Date()
          });
          
          console.log(`Chat billing session ${activeSession._id} ended by user ${userId}`);
        }
      }
      
      socket.leave(chatId);
      console.log(`User ${userId} left chat ${chatId}`);
    } catch (error) {
      console.error('Error in leaveChat:', error);
    }
  });

  // Edit Message
  socket.on('editMessage', async ({ chatId, messageId, newContent }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        console.error(`Chat not found: ${chatId}`);
        return;
      }

      const message = chat.messages.id(messageId);
      if (!message) return;

      // Check if the user is the sender and within 10 minutes
      if (message.sender.toString() !== socket.user.id) return;
      const messageTime = new Date(message.createdAt);
      const now = new Date();
      const diffMinutes = (now - messageTime) / (1000 * 60);
      if (diffMinutes > 10) return;

      message.content = newContent;
      await chat.save();

      io.to(chatId).emit('messageEdited', {
        chatId,
        message: {
          _id: message._id,
          sender: message.sender,
          content: message.content,
          createdAt: message.createdAt,
          type: message.type,
          replyTo: message.replyTo
        }
      });
      console.log(`Message ${messageId} edited in chat ${chatId} by user ${socket.user.id}`);
    } catch (error) {
      console.error("Error in editMessage:", error);
    }
  });

  // Delete Message
  socket.on('deleteMessage', async ({ chatId, messageId }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      const message = chat.messages.id(messageId);
      if (!message) return;

      // Allow delete if sender or if message is less than 10 minutes old
      const canDelete = message.sender.toString() === socket.user.id ||
        (Date.now() - message.createdAt.getTime()) <= 600000;

      if (!canDelete) return;

      await chat.updateOne({ $pull: { messages: { _id: messageId } } });
      io.to(chatId).emit('messageDeleted', { chatId, messageId });
    } catch (error) {
      console.error("Error in deleteMessage:", error);
    }
  });


  // Typing Indicators
  socket.on('typing', ({ chatId, isTyping }) => {
    socket.to(chatId).emit('typing', { userId: socket.user.id, isTyping });
  });

  // Handle reactions
  socket.on("reactToMessage", async ({ chatId, messageId, emoji }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) throw new Error('Chat not found');

      const message = chat.messages.id(messageId);
      if (!message) throw new Error('Message not found');

      // Initialize reactions if needed
      if (!message.reactions) {
        message.reactions = new Map();
      }

      // Toggle reaction
      if (message.reactions.get(socket.user.id) === emoji) {
        message.reactions.delete(socket.user.id);
      } else {
        message.reactions.set(socket.user.id, emoji);
      }

      await chat.save();

      // Convert Map to plain object for emitting
      const reactionsObj = {};
      message.reactions.forEach((value, key) => {
        reactionsObj[key] = value;
      });

      io.to(chatId).emit("messageReactionUpdated", {
        chatId,
        messageId,
        reactions: reactionsObj
      });

    } catch (error) {
      console.error("Error in reactToMessage:", error);
      socket.emit("errorMessage", {
        message: "Failed to add reaction",
        error: error.message
      });
    }
  });


  // Generate AI Summary
  socket.on('generateSummary', async ({ chatId }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        console.error(`Chat not found: ${chatId}`);
        return;
      }

      const promptText = chat.messages.map(msg => {
        const senderName = msg.sender ? msg.sender.name : 'System'; 
        return `${senderName}: ${msg.content}`;
      }).join('\n');


      const summary = await generateSummary(promptText);

      io.to(chatId).emit('summary', { summary });
    } catch (error) {
      console.error(error);
    }
  });

  // Get wallet balance
  socket.on('getWalletBalance', async (callback) => {
    try {
      const userId = socket.user.id;
      const balance = await walletService.getWalletBalance(userId);
      
      if (callback) {
        callback({
          success: true,
          balance
        });
      }
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  });

};
