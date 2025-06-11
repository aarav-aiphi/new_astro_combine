const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['recharge', 'debit', 'credit'],
    required: true
  },
  amountPaise: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    balancePaise: {
      type: Number,
      default: 0,
      min: 0
    },
    history: [transactionSchema]
  },
  { timestamps: true }
);

// Create partial index for transactionId uniqueness - only index when transactionId exists
walletSchema.index(
  { 'history.transactionId': 1 },
  {
    unique: true,
    partialFilterExpression: { 'history.transactionId': { $exists: true } }
  }
);

module.exports = mongoose.model('Wallet', walletSchema); 