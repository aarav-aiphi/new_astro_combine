const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');
const Session = require('../models/session.model');
const User = require('../models/user.model');
const Astrologer = require('../models/astrologer.model');

/**
 * Get or create wallet for a user
 */
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ userId });
  
  if (!wallet) {
    wallet = new Wallet({ userId });
    await wallet.save();
  }
  
  return wallet;
};

/**
 * Get user's wallet balance
 */
const getWalletBalance = async (userId) => {
  const wallet = await getOrCreateWallet(userId);
  return wallet.balancePaise;
};

/**
 * Update wallet balance
 */
const updateWalletBalance = async (userId, amount) => {
  const wallet = await getOrCreateWallet(userId);
  wallet.balancePaise += amount;
  
  if (wallet.balancePaise < 0) {
    wallet.balancePaise = 0;
  }
  
  await wallet.save();
  return wallet.balancePaise;
};

/**
 * Check if user has sufficient balance for a session
 */
const hasSufficientBalance = async (userId, minutes, ratePerMinute) => {
  const wallet = await getOrCreateWallet(userId);
  const requiredAmount = minutes * ratePerMinute;
  return wallet.balancePaise >= requiredAmount;
};

/**
 * Create a new session
 */
const createSession = async (userId, astrologerId, sessionType, chatId = null) => {
  const astrologer = await Astrologer.findOne({ userId: astrologerId });
  
  if (!astrologer) {
    throw new Error('Astrologer not found');
  }
  
  const ratePerMinute = astrologer.ratePaisePerMin;
  
  // Check if user has sufficient balance for at least 1 minute
  const hasBalance = await hasSufficientBalance(userId, 1, ratePerMinute);
  
  if (!hasBalance) {
    throw new Error('Insufficient balance');
  }
  
  const session = new Session({
    userId,
    astrologerId,
    sessionType,
    ratePerMinute,
    relatedChat: chatId
  });
  
  await session.save();
  return session;
};

/**
 * End a session and process payment
 */
const endSession = async (sessionId) => {
  const session = await Session.findById(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.status !== 'active') {
    throw new Error('Session is not active');
  }
  
  // Update session status and end time
  session.status = 'ended';
  session.endTime = new Date();
  
  // Calculate duration in seconds
  const durationInSeconds = Math.floor((session.endTime - session.startTime) / 1000);
  session.duration = durationInSeconds;
  
  // Calculate cost (convert seconds to minutes and round up)
  const durationInMinutes = Math.ceil(durationInSeconds / 60);
  const cost = durationInMinutes * session.ratePerMinute;
  session.totalCost = cost;
  
  // Update wallet balance
  await updateWalletBalance(session.userId, -cost);
  
  // Create transaction record
  const transaction = new Transaction({
    userId: session.userId,
    astrologerId: session.astrologerId,
    sessionId: session._id,
    type: session.sessionType,
    amount: cost,
    duration: durationInSeconds,
    status: 'completed',
    startTime: session.startTime,
    endTime: session.endTime
  });
  
  await Promise.all([session.save(), transaction.save()]);
  
  return { session, transaction };
};

/**
 * Get active session by user and astrologer
 */
const getActiveSession = async (userId, astrologerId, sessionType) => {
  return Session.findOne({
    userId,
    astrologerId,
    sessionType,
    status: 'active'
  });
};

/**
 * Get user's transaction history
 */
const getUserTransactions = async (userId) => {
  return Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .populate('astrologerId', 'name avatar');
};

module.exports = {
  getOrCreateWallet,
  getWalletBalance,
  updateWalletBalance,
  hasSufficientBalance,
  createSession,
  endSession,
  getActiveSession,
  getUserTransactions
}; 