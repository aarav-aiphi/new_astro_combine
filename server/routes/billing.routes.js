const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const verifyToken = require('../utils/verifyUser');

// Get billing session receipt
router.get('/session/:id', verifyToken, billingController.getSessionReceipt);

// Get user's billing history
router.get('/history', verifyToken, billingController.getBillingHistory);

// Get active billing session
router.get('/active', verifyToken, billingController.getActiveSession);

// Get billing engine statistics (admin only)
router.get('/stats', verifyToken, billingController.getBillingStats);

module.exports = router; 