const mongoose = require('mongoose');
const { billingEngine } = require('./services/BillingEngine');
require('dotenv').config();

async function testEndSession() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Test data
    const testUserId = '6847a95047dda6bedf87545e';
    const testAstrologerId = '6847a95047dda6bedf875460';
    
    console.log('\n🧪 Testing End Session Functionality');
    console.log('=====================================\n');

    // 1. Start a test session
    console.log('1. Starting test session...');
    const sessionId = await billingEngine.startSession({
      userId: testUserId,
      astrologerId: testAstrologerId,
      ratePaisePerMin: 2500, // ₹25/min
      sessionType: 'chat',
      socket: { 
        emit: (event, data) => console.log(`📡 Socket emit: ${event}`, data),
        user: { id: testUserId }
      }
    });
    console.log(`✅ Session started: ${sessionId}`);

    // 2. Wait a bit to simulate usage
    console.log('\n2. Waiting 5 seconds to simulate session usage...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Test ending session (user requested)
    console.log('\n3. Testing user-requested session end...');
    await billingEngine.stopSession(sessionId, 'user_requested');
    console.log('✅ Session ended successfully');

    // 4. Verify session is stopped
    console.log('\n4. Verifying session is stopped...');
    const activeSession = await billingEngine.getActiveSession(testUserId);
    if (!activeSession || !activeSession.live) {
      console.log('✅ Session properly stopped');
    } else {
      console.log('❌ Session still active');
    }

    // 5. Test ending non-existent session
    console.log('\n5. Testing end of non-existent session...');
    try {
      await billingEngine.stopSession('non-existent-session-id', 'user_requested');
      console.log('ℹ️ No error for non-existent session (expected)');
    } catch (error) {
      console.log('ℹ️ Error for non-existent session:', error.message);
    }

    console.log('\n🎉 End Session test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Test interrupted');
  await mongoose.disconnect();
  process.exit(0);
});

testEndSession(); 