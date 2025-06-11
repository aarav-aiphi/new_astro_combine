const mongoose = require("mongoose");

const billingSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    astrologerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Astrologer',
      required: true
    },
    ratePaisePerMin: {
      type: Number,
      required: true,
      min: 1
    },
    secondsElapsed: {
      type: Number,
      default: 0,
      min: 0
    },
    live: {
      type: Boolean,
      default: true
    },
    endedAt: {
      type: Date,
      default: null
    },
    totalCostPaise: {
      type: Number,
      default: 0,
      min: 0
    },
    sessionType: {
      type: String,
      enum: ['chat', 'call'],
      required: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    lastTickAt: {
      type: Date,
      default: null
    },
    totalPaiseDeducted: {
      type: Number,
      default: 0,
      min: 0
    },
    duration: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for performance
billingSessionSchema.index({ userId: 1, live: 1 });
billingSessionSchema.index({ astrologerId: 1, live: 1 });
billingSessionSchema.index({ createdAt: -1 });

// Calculate cost based on seconds elapsed
billingSessionSchema.methods.calculateCurrentCost = function() {
  const minutesElapsed = this.secondsElapsed / 60;
  return Math.ceil(minutesElapsed * this.ratePaisePerMin);
};

// End the session
billingSessionSchema.methods.endSession = function() {
  this.live = false;
  this.endedAt = new Date();
  this.totalCostPaise = this.calculateCurrentCost();
  return this.save();
};

module.exports = mongoose.model('BillingSession', billingSessionSchema); 