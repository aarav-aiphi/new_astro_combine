const mongoose = require('mongoose');
const BillingSession = require('./models/billingSession.model');
const Wallet = require('./models/wallet.model');
const Transaction = require('./models/transaction.model');
const User = require('./models/user.model');
const Astrologer = require('./models/astrologer.model');
require('dotenv').config();

async function debugBillingSystem() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    console.log('\n💰 Debugging Billing System');
    console.log('============================\n');

    // 1. Check active billing sessions
    console.log('1. Checking active billing sessions...');
    const activeSessions = await BillingSession.find({ live: true }).lean();
    console.log(`Found ${activeSessions.length} active billing sessions\n`);

    for (const session of activeSessions) {
      console.log(`Session ${session._id}:`);
      console.log(`  - userId: ${session.userId}`);
      console.log(`  - astrologerId: ${session.astrologerId}`);
      console.log(`  - ratePaisePerMin: ${session.ratePaisePerMin}`);
      console.log(`  - sessionType: ${session.sessionType}`);
      console.log(`  - live: ${session.live}`);
      console.log(`  - startedAt: ${session.startedAt}`);
      console.log(`  - lastTickAt: ${session.lastTickAt || 'NEVER'}`);
      console.log(`  - totalPaiseDeducted: ${session.totalPaiseDeducted || 0}`);
      console.log(`  - duration: ${session.duration || 0} seconds`);
      
      // Calculate expected deduction
      const sessionDurationMs = Date.now() - new Date(session.startedAt).getTime();
      const sessionDurationMin = sessionDurationMs / (1000 * 60);
      const expectedDeduction = Math.ceil(sessionDurationMin * session.ratePaisePerMin);
      
      console.log(`  - actual duration: ${Math.floor(sessionDurationMin * 100) / 100} minutes`);
      console.log(`  - expected total deduction: ${expectedDeduction} paise`);
      console.log(`  - actual deduction: ${session.totalPaiseDeducted || 0} paise`);
      console.log(`  - deduction gap: ${expectedDeduction - (session.totalPaiseDeducted || 0)} paise`);
      
      // Check user wallet
      const userWallet = await Wallet.findOne({ userId: session.userId });
      console.log(`  - user wallet balance: ${userWallet ? userWallet.balancePaise : 'NO WALLET'} paise`);
      
      // Check recent transactions for this user
      const recentTransactions = await Transaction.find({ 
        userId: session.userId,
        createdAt: { $gte: session.startedAt }
      }).sort({ createdAt: -1 }).limit(5);
      
      console.log(`  - recent transactions: ${recentTransactions.length}`);
      recentTransactions.forEach((txn, index) => {
        console.log(`    ${index + 1}. ${txn.type}: ${txn.amount} paise at ${txn.createdAt}`);
      });
      
      console.log('');
    }

    // 2. Check BillingEngine status
    console.log('2. Checking BillingEngine status...');
    try {
      const { billingEngine } = require('./services/BillingEngine.js');
      console.log(`✅ BillingEngine loaded successfully`);
      console.log(`  - Tick interval: ${billingEngine.TICK_SECONDS} seconds`);
      console.log(`  - Is running: ${billingEngine.isRunning ? 'YES' : 'NO'}`);
      
      // Check if ticker is active
      if (billingEngine.ticker) {
        console.log(`  - Ticker active: YES`);
      } else {
        console.log(`  - Ticker active: NO`);
      }
      
    } catch (error) {
      console.log(`❌ BillingEngine error: ${error.message}`);
    }

    // 3. Test billing calculation
    console.log('\n3. Testing billing calculations...');
    if (activeSessions.length > 0) {
      const testSession = activeSessions[0];
      const tickSeconds = parseInt(process.env.TICK_SECONDS || '15');
      const tickDeduction = Math.ceil(testSession.ratePaisePerMin * tickSeconds / 60);
      
      console.log(`Test session: ${testSession._id}`);
      console.log(`  - Rate: ${testSession.ratePaisePerMin} paise/min`);
      console.log(`  - Tick interval: ${tickSeconds} seconds`);
      console.log(`  - Deduction per tick: ${tickDeduction} paise`);
      console.log(`  - Expected deductions per minute: ${60 / tickSeconds} ticks`);
      console.log(`  - Expected total per minute: ${(60 / tickSeconds) * tickDeduction} paise`);
    }

    // 4. Check recent billing transactions
    console.log('\n4. Checking recent billing transactions...');
    const billingTransactions = await Transaction.find({ 
      type: 'BILLING_DEDUCTION',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).sort({ createdAt: -1 }).limit(10);
    
    console.log(`Found ${billingTransactions.length} billing transactions in last 24 hours\n`);
    
    billingTransactions.forEach((txn, index) => {
      console.log(`${index + 1}. User ${txn.userId}:`);
      console.log(`   - Amount: ${txn.amount} paise`);
      console.log(`   - At: ${txn.createdAt}`);
      console.log(`   - Description: ${txn.description || 'N/A'}`);
      console.log('');
    });

    // 5. Check wallet balances for active session users
    console.log('5. Checking wallet balances for active users...');
    for (const session of activeSessions) {
      const user = await User.findById(session.userId).select('name');
      const wallet = await Wallet.findOne({ userId: session.userId });
      
      console.log(`User ${user.name} (${session.userId}):`);
      console.log(`  - Wallet balance: ${wallet ? wallet.balancePaise : 'NO WALLET'} paise`);
      console.log(`  - Can afford next tick: ${wallet && wallet.balancePaise >= Math.ceil(session.ratePaisePerMin * 15 / 60) ? 'YES' : 'NO'}`);
    }

    // 6. Manual billing engine test
    console.log('\n6. Testing manual billing engine tick...');
    if (activeSessions.length > 0) {
      try {
        const { billingEngine } = require('./services/BillingEngine.js');
        
        console.log('Attempting manual processTick...');
        
        // Get the session before processing
        const sessionBefore = await BillingSession.findById(activeSessions[0]._id);
        console.log(`Session before tick:`);
        console.log(`  - totalPaiseDeducted: ${sessionBefore.totalPaiseDeducted || 0}`);
        console.log(`  - lastTickAt: ${sessionBefore.lastTickAt || 'NEVER'}`);
        
        // Process a manual tick
        await billingEngine.processTick();
        
        // Get the session after processing
        const sessionAfter = await BillingSession.findById(activeSessions[0]._id);
        console.log(`Session after tick:`);
        console.log(`  - totalPaiseDeducted: ${sessionAfter.totalPaiseDeducted || 0}`);
        console.log(`  - lastTickAt: ${sessionAfter.lastTickAt || 'NEVER'}`);
        
        const deductionDiff = (sessionAfter.totalPaiseDeducted || 0) - (sessionBefore.totalPaiseDeducted || 0);
        console.log(`  - Deduction this tick: ${deductionDiff} paise`);
        
        if (deductionDiff > 0) {
          console.log(`✅ Billing engine is working - deducted ${deductionDiff} paise`);
        } else {
          console.log(`❌ Billing engine not working - no deduction occurred`);
        }
        
      } catch (error) {
        console.log(`❌ Manual tick failed: ${error.message}`);
      }
    }

    // 7. Check environment variables
    console.log('\n7. Checking environment configuration...');
    console.log(`TICK_SECONDS: ${process.env.TICK_SECONDS || 'NOT SET (defaulting to 15)'}`);
    console.log(`MONGODB_URL: ${process.env.MONGODB_URL ? 'SET' : 'NOT SET'}`);

    console.log('\n🎉 Billing system analysis completed!');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Analysis interrupted');
  await mongoose.disconnect();
  process.exit(0);
});

debugBillingSystem(); 