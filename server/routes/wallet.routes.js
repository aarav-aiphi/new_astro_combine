const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const verifyToken = require('../utils/verifyUser');

// Get wallet balance
router.get('/balance', verifyToken, walletController.getWalletBalance);

// Recharge wallet (dummy implementation)
router.post('/recharge', verifyToken, walletController.recharge);

// Get transaction history
router.get('/transactions', verifyToken, walletController.getTransactions);

module.exports = router; 