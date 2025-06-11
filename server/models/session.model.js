const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    astrologerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sessionType: {
      type: String,
      enum: ['chat', 'call'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'ended', 'terminated'],
      default: 'active'
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number, // in seconds
      default: 0
    },
    ratePerMinute: {
      type: Number,
      required: true
    },
    totalCost: {
      type: Number,
      default: 0
    },
    relatedChat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema); 