const mongoose = require('mongoose');
const BillingSession = require('./models/billingSession.model');
const { billingEngine } = require('./services/BillingEngine.js');
require('dotenv').config();

async function restartBillingSessions() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    console.log('\n🔄 Restarting Billing Sessions');
    console.log('===============================\n');

    // 1. Get all active sessions
    const activeSessions = await BillingSession.find({ live: true });
    console.log(`Found ${activeSessions.length} active billing sessions\n`);

    // 2. Stop all current intervals (clean up)
    console.log('2. Cleaning up existing intervals...');
    for (const [sessionId, intervalId] of billingEngine.activeSessions) {
      console.log(`  - Clearing interval for session ${sessionId}`);
      clearInterval(intervalId);
    }
    billingEngine.activeSessions.clear();
    console.log('✅ Cleared all existing intervals\n');

    // 3. Restart each active session with proper intervals
    console.log('3. Restarting sessions with proper intervals...');
    
    for (const session of activeSessions) {
      console.log(`Restarting session ${session._id}:`);
      console.log(`  - User: ${session.userId}`);
      console.log(`  - Astrologer: ${session.astrologerId}`);
      console.log(`  - Rate: ${session.ratePaisePerMin} paise/min`);
      console.log(`  - Type: ${session.sessionType}`);
      
      try {
        // Create a mock socket for processTick
        const mockSocket = {
          emit: (event, data) => {
            console.log(`    📡 Socket emit: ${event}`, data);
          }
        };

        // Start the billing timer for this session
        const intervalId = setInterval(async () => {
          try {
            await billingEngine.processTick(session._id.toString(), mockSocket);
          } catch (error) {
            console.error(`Error in tick for session ${session._id}:`, error.message);
          }
        }, billingEngine.TICK_SECONDS * 1000);

        // Add to active sessions map
        billingEngine.activeSessions.set(session._id.toString(), intervalId);
        
        console.log(`  ✅ Started interval (every ${billingEngine.TICK_SECONDS}s)`);
        
        // Test one tick immediately
        console.log(`  🧪 Testing immediate tick...`);
        await billingEngine.processTick(session._id.toString(), mockSocket);
        
      } catch (error) {
        console.log(`  ❌ Failed to restart session: ${error.message}`);
      }
      
      console.log('');
    }

    // 4. Verify active sessions
    console.log('4. Verification...');
    console.log(`Active intervals in memory: ${billingEngine.activeSessions.size}`);
    console.log(`BillingEngine tick interval: ${billingEngine.TICK_SECONDS} seconds`);
    
    // List all active intervals
    for (const [sessionId] of billingEngine.activeSessions) {
      console.log(`  - Session ${sessionId}: ✅ Active interval`);
    }

    console.log('\n5. Testing billing calculations...');
    for (const session of activeSessions) {
      const tickDeduction = Math.ceil(session.ratePaisePerMin * billingEngine.TICK_SECONDS / 60);
      console.log(`Session ${session._id}:`);
      console.log(`  - Rate: ${session.ratePaisePerMin} paise/min`);
      console.log(`  - Deduction per tick: ${tickDeduction} paise`);
      console.log(`  - Ticks per minute: ${60 / billingEngine.TICK_SECONDS}`);
      console.log(`  - Total per minute: ${(60 / billingEngine.TICK_SECONDS) * tickDeduction} paise`);
    }

    console.log('\n🎉 Billing sessions restarted successfully!');
    console.log('\n⚠️  NOTE: Keep this process running to maintain billing intervals');
    console.log('Press Ctrl+C to stop...\n');

    // Keep process alive to maintain intervals
    setInterval(() => {
      console.log(`💰 ${new Date().toLocaleTimeString()}: Billing engine running with ${billingEngine.activeSessions.size} active sessions`);
    }, 60000); // Status update every minute

  } catch (error) {
    console.error('❌ Restart failed:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Stopping billing sessions...');
  
  // Stop all intervals
  for (const [sessionId, intervalId] of billingEngine.activeSessions) {
    clearInterval(intervalId);
    console.log(`Stopped interval for session ${sessionId}`);
  }
  billingEngine.activeSessions.clear();
  
  await mongoose.disconnect();
  console.log('✅ Billing engine stopped gracefully');
  process.exit(0);
});

restartBillingSessions(); 