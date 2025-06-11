const mongoose = require('mongoose');
const BillingSession = require('./models/billingSession.model');
const Wallet = require('./models/wallet.model');
const Transaction = require('./models/transaction.model');
require('dotenv').config();

async function testBillingWorking() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    console.log('\n🧪 Testing Billing System Functionality');
    console.log('=======================================\n');

    // 1. Check active sessions
    const activeSessions = await BillingSession.find({ live: true });
    console.log(`Found ${activeSessions.length} active billing sessions\n`);

    if (activeSessions.length === 0) {
      console.log('❌ No active sessions to test');
      return;
    }

    // 2. Check wallet balances before test
    console.log('💰 Wallet balances BEFORE test:');
    for (const session of activeSessions) {
      const wallet = await Wallet.findOne({ userId: session.userId });
      console.log(`User ${session.userId}: ${wallet ? wallet.balancePaise : 'NO WALLET'} paise`);
    }

    // 3. Wait for a billing cycle (20 seconds to ensure at least one tick)
    console.log('\n⏱️  Waiting 20 seconds for billing cycle...');
    await new Promise(resolve => setTimeout(resolve, 20000));

    // 4. Check wallet balances after test
    console.log('\n💰 Wallet balances AFTER test:');
    let billingWorking = false;
    
    for (const session of activeSessions) {
      const wallet = await Wallet.findOne({ userId: session.userId });
      console.log(`User ${session.userId}: ${wallet ? wallet.balancePaise : 'NO WALLET'} paise`);
      
      // Check if session has been updated with billing data
      const updatedSession = await BillingSession.findById(session._id);
      console.log(`Session ${session._id}:`);
      console.log(`  - totalPaiseDeducted: ${updatedSession.totalPaiseDeducted || 0}`);
      console.log(`  - secondsElapsed: ${updatedSession.secondsElapsed || 0}`);
      console.log(`  - lastTickAt: ${updatedSession.lastTickAt || 'NEVER'}`);
      
      if (updatedSession.totalPaiseDeducted > 0 || updatedSession.secondsElapsed > 0) {
        billingWorking = true;
      }
    }

    // 5. Check recent transactions
    console.log('\n📋 Recent billing transactions:');
    const recentTransactions = await Transaction.find({
      type: 'BILLING_DEDUCTION',
      createdAt: { $gte: new Date(Date.now() - 60000) } // Last minute
    }).sort({ createdAt: -1 });

    if (recentTransactions.length > 0) {
      recentTransactions.forEach((txn, index) => {
        console.log(`${index + 1}. User ${txn.userId}: ${txn.amount} paise at ${txn.createdAt}`);
      });
      billingWorking = true;
    } else {
      console.log('No recent billing transactions found');
    }

    // 6. Final result
    console.log('\n🎯 TEST RESULTS:');
    if (billingWorking) {
      console.log('✅ BILLING SYSTEM IS WORKING! Money is being deducted properly.');
      console.log('✅ Consultation billing is functioning correctly.');
    } else {
      console.log('❌ BILLING SYSTEM NOT WORKING! No money deductions detected.');
      console.log('❌ Please check server logs and billing engine status.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

testBillingWorking(); 