const walletService = require('../utils/wallet.service');
const User = require('../models/user.model');
const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');
const Session = require('../models/session.model');
const { v4: uuidv4 } = require('uuid');

// Dummy Payment Provider - always succeeds
class DummyPaymentProvider {
  static async processPayment(amountPaise, userId) {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Always succeed for dummy implementation
    return {
      success: true,
      transactionId: uuidv4(),
      amountPaise,
      timestamp: new Date()
    };
  }
}

/**
 * Get user's wallet balance
 */
exports.getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balancePaise: 0, history: [] });
      await wallet.save();
    }
    
    res.status(200).json({
      success: true,
      data: { balancePaise: wallet.balancePaise }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Recharge wallet using dummy payment provider
 */
exports.recharge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amountPaise } = req.body;
    
    // Validate amount
    if (!amountPaise || typeof amountPaise !== 'number' || amountPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Amount must be a positive number in paise.'
      });
    }
    
    // Process payment through dummy provider
    const paymentResult = await DummyPaymentProvider.processPayment(amountPaise, userId);
    
    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment processing failed'
      });
    }
    
    // Find or create wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balancePaise: 0, history: [] });
    }
    
    // Add transaction to history
    const transaction = {
      type: 'recharge',
      amountPaise,
      description: `Wallet recharge via dummy payment provider`,
      transactionId: paymentResult.transactionId,
      timestamp: paymentResult.timestamp
    };
    
    // Update wallet
    wallet.balancePaise += amountPaise;
    wallet.history.push(transaction);
    
    await wallet.save();
    
    res.status(200).json({
      success: true,
      data: { 
        balancePaise: wallet.balancePaise,
        transaction
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get user's transaction history
 */
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      return res.status(200).json({
        success: true,
        data: { transactions: [] }
      });
    }
    
    res.status(200).json({
      success: true,
      data: { transactions: wallet.history }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get active session details
 */
exports.getActiveSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { astrologerId, sessionType } = req.query;
    
    if (!astrologerId || !sessionType) {
      return res.status(400).json({
        success: false,
        message: 'astrologerId and sessionType are required'
      });
    }
    
    const session = await walletService.getActiveSession(userId, astrologerId, sessionType);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { session }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create a new session
 */
exports.createSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { astrologerId, sessionType, chatId } = req.body;
    
    if (!astrologerId || !sessionType) {
      return res.status(400).json({
        success: false,
        message: 'astrologerId and sessionType are required'
      });
    }
    
    // Check if an active session already exists
    const existingSession = await walletService.getActiveSession(userId, astrologerId, sessionType);
    
    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'An active session already exists'
      });
    }
    
    const session = await walletService.createSession(userId, astrologerId, sessionType, chatId);
    
    res.status(201).json({
      success: true,
      data: { session }
    });
  } catch (error) {
    res.status(error.message === 'Insufficient balance' ? 400 : 500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * End an active session
 */
exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }
    
    const { session, transaction } = await walletService.endSession(sessionId);
    
    res.status(200).json({
      success: true,
      data: { 
        session,
        transaction,
        message: `Session ended. ₹${transaction.amount} deducted from your wallet.`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 