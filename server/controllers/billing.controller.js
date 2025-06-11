const BillingSession = require('../models/billingSession.model');
const { billingEngine } = require('../services/BillingEngine.js');

/**
 * Get billing session receipt
 */
exports.getSessionReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the session and ensure it belongs to the user
    const session = await BillingSession.findOne({
      _id: id,
      userId: userId
    }).populate('astrologerId', 'name specializations avatar');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Billing session not found'
      });
    }

    // Calculate final cost if session is still live
    const finalCost = session.live ? session.calculateCurrentCost() : session.totalCostPaise;
    const durationMinutes = Math.ceil(session.secondsElapsed / 60);

    const receipt = {
      sessionId: session._id,
      astrologer: session.astrologerId,
      sessionType: session.sessionType,
      ratePaisePerMin: session.ratePaisePerMin,
      durationSeconds: session.secondsElapsed,
      durationMinutes,
      totalCostPaise: finalCost,
      isLive: session.live,
      startedAt: session.createdAt,
      endedAt: session.endedAt,
      costBreakdown: {
        ratePerMinute: `₹${(session.ratePaisePerMin / 100).toFixed(2)}`,
        totalMinutes: durationMinutes,
        totalCost: `₹${(finalCost / 100).toFixed(2)}`
      }
    };

    res.status(200).json({
      success: true,
      data: { receipt }
    });

  } catch (error) {
    console.error('Error fetching billing session receipt:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get user's billing history
 */
exports.getBillingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    const sessions = await BillingSession.find({ userId })
      .populate('astrologerId', 'name specializations avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BillingSession.countDocuments({ userId });

    const history = sessions.map(session => ({
      sessionId: session._id,
      astrologer: session.astrologerId,
      sessionType: session.sessionType,
      durationMinutes: Math.ceil(session.secondsElapsed / 60),
      totalCostPaise: session.live ? session.calculateCurrentCost() : session.totalCostPaise,
      isLive: session.live,
      startedAt: session.createdAt,
      endedAt: session.endedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        history,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalSessions: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get active billing session for user
 */
exports.getActiveSession = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const activeSession = await billingEngine.getActiveSession(userId);
    
    if (!activeSession) {
      return res.status(404).json({
        success: false,
        message: 'No active billing session found'
      });
    }

    const currentCost = activeSession.calculateCurrentCost();
    const durationMinutes = Math.ceil(activeSession.secondsElapsed / 60);

    res.status(200).json({
      success: true,
      data: {
        sessionId: activeSession._id,
        astrologer: activeSession.astrologerId,
        sessionType: activeSession.sessionType,
        ratePaisePerMin: activeSession.ratePaisePerMin,
        durationSeconds: activeSession.secondsElapsed,
        durationMinutes,
        currentCostPaise: currentCost,
        startedAt: activeSession.createdAt,
        isLive: activeSession.live
      }
    });

  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get billing engine statistics (admin only)
 */
exports.getBillingStats = async (req, res) => {
  try {
    // TODO: Add admin role check
    const stats = billingEngine.getStats();
    
    const dbStats = await BillingSession.aggregate([
      { $match: { live: true } },
      {
        $group: {
          _id: null,
          totalActiveSessions: { $sum: 1 },
          totalSecondsElapsed: { $sum: '$secondsElapsed' },
          avgSessionDuration: { $avg: '$secondsElapsed' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        engine: stats,
        database: dbStats[0] || {
          totalActiveSessions: 0,
          totalSecondsElapsed: 0,
          avgSessionDuration: 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching billing stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 