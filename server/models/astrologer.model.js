const mongoose = require("mongoose");

const astrologerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    tag: {
      type: String,
      enum: [null, 'Celebrity'],
      default: null
    },
    verification: {
      type: String,
      enum: [null, 'verified'],
      default: null
    },
    specializations: [{
      specialization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialization'
      },
      yearsOfExperience: {
        type: Number,
        required: true
      },
      certificates: [{
        name: String,
        url: String,
        verificationStatus: {
          type: String,
          enum: ['pending', 'verified', 'rejected'],
          default: 'pending'
        }
      }]
    }],
    languages: [{
      type: String,
      required: true
    }],
    experience: {
      type: Number,
      required: true
    },
    // Legacy field for backward compatibility
    costPerMinute: {
      type: Number,
      required: true
    },
    // New billing rate fields in paise
    ratePaisePerMin: {
      type: Number,
      required: true,
      min: 1
    },
    ratePaisePerMinChat: {
      type: Number,
      min: 1
    },
    ratePaisePerMinCall: {
      type: Number,
      min: 1
    },
    chatMinutes: {
      type: Number,
      default: 0
    },
    callMinutes: {
      type: Number,
      default: 0
    },
    chatStatus: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline'
    },
    callStatus: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline'
    },
    about: {
      type: String,
      required: true
    },
    totalConsultations: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Virtual field to get rate in rupees for display
astrologerSchema.virtual('ratePerMinute').get(function() {
  return this.ratePaisePerMin / 100;
});

astrologerSchema.virtual('ratePerMinuteChat').get(function() {
  return (this.ratePaisePerMinChat || this.ratePaisePerMin) / 100;
});

astrologerSchema.virtual('ratePerMinuteCall').get(function() {
  return (this.ratePaisePerMinCall || this.ratePaisePerMin) / 100;
});

// Ensure virtual fields are serialized
astrologerSchema.set('toJSON', { virtuals: true });
astrologerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Astrologer', astrologerSchema);