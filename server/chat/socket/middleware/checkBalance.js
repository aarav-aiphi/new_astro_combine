const { billingEngine } = require('../../../services/BillingEngine.js');
const Wallet = require('../../../models/wallet.model');

/**
 * Middleware to check if user has sufficient balance for next tick
 * Called before allowing chat messages or call actions
 * @param {Object} socket - Socket.io socket object
 * @param {Object} opts - Options object (for future extensibility)
 * @returns {Promise<boolean>} - Returns true if balance is sufficient, false otherwise
 */
module.exports = async function checkBalance(socket, opts = {}) {
  try {
    // Astrologers don't need balance checks - they earn money, not spend it
    if (socket.user.role === 'astrologer' || socket.user.role === 'Astrologer') {
      return true;
    }
    
    // Get active billing session for this user
    const active = await billingEngine.getActiveSession(socket.user.id);
    
    // If no active session, allow the action (e.g., free greeting messages)
    if (!active) {
      return true;
    }

    // Calculate next tick deduction amount
    const deductionPaise = Math.ceil(
      active.ratePaisePerMin * billingEngine.TICK_SECONDS / 60
    );

    // Get current wallet balance
    const wallet = await Wallet.findOne(
      { userId: socket.user.id }, 
      'balancePaise'
    );

    // Check if wallet has sufficient balance for next tick
    if (wallet && wallet.balancePaise >= deductionPaise) {
      return true; // Allow the action
    }

    // Insufficient balance - emit warning and block the action
    socket.emit('billing:low-balance', {
      sessionId: active._id.toString(),
      balancePaise: wallet?.balancePaise ?? 0,
      requiredPaise: deductionPaise,
      message: 'Insufficient balance to continue. Please recharge within 30 seconds.',
      graceTimeSeconds: 30
    });

    console.log(`🚫 Action blocked for user ${socket.user.id}: insufficient balance (${wallet?.balancePaise ?? 0} < ${deductionPaise})`);
    
    return false; // Block the action
    
  } catch (error) {
    console.error('Error in checkBalance middleware:', error);
    // On error, allow the action to prevent disrupting the service
    return true;
  }
}; 