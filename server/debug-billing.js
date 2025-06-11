const { billingEngine } = require('./services/BillingEngine.js');
const mongoose = require('mongoose');
const User = require('./models/user.model.js');
const Astrologer = require('./models/astrologer.model.js');
const Wallet = require('./models/wallet.model.js');

// Load environment variables
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/astro');

async function debugBilling() {
  try {
    console.log('🔍 Starting billing system debug...');
    
    // Find a test user and astrologer
    const user = await User.findOne({ role: 'User' });
    const astrologer = await Astrologer.findOne();
    
    if (!user || !astrologer) {
      console.log('❌ No user or astrologer found in database');
      return;
    }
    
    console.log('👤 Found user:', user.name, '(ID:', user._id, ')');
    console.log('🔮 Found astrologer:', astrologer.name, '(ID:', astrologer._id, ')');
    
    // Check user wallet
    const wallet = await Wallet.findOne({ userId: user._id });
    console.log('💰 User wallet balance:', wallet?.balancePaise || 0, 'paise (₹' + ((wallet?.balancePaise || 0) / 100).toFixed(2) + ')');
    
    // Check astrologer rates
    console.log('💵 Astrologer rates:');
    console.log('  - Base rate:', astrologer.ratePaisePerMin || 'Not set');
    console.log('  - Chat rate:', astrologer.ratePaisePerMinChat || 'Not set');
    console.log('  - Call rate:', astrologer.ratePaisePerMinCall || 'Not set');
    
    // Check for active sessions
    const activeSession = await billingEngine.getActiveSession(user._id.toString());
    console.log('📊 Active billing session:', activeSession ? 'YES' : 'NO');
    
    if (activeSession) {
      console.log('  - Session ID:', activeSession._id);
      console.log('  - Rate:', activeSession.ratePaisePerMin, 'paise/min');
      console.log('  - Elapsed:', activeSession.secondsElapsed, 'seconds');
      console.log('  - Live:', activeSession.live);
    }
    
    // Test starting a billing session (mock socket)
    const mockSocket = {
      emit: (event, data) => console.log('📡 Socket emit:', event, data)
    };
    
    if (!activeSession && wallet && wallet.balancePaise > 0) {
      console.log('\n🚀 Testing billing session start...');
      
      try {
        const sessionId = await billingEngine.startSession({
          userId: user._id.toString(),
          astrologerId: astrologer._id.toString(),
          ratePaisePerMin: astrologer.ratePaisePerMinChat || astrologer.ratePaisePerMin || 3000,
          sessionType: 'chat',
          socket: mockSocket
        });
        
        console.log('✅ Billing session started successfully!');
        console.log('📋 Session ID:', sessionId);
        
        // Wait for one tick to see if it processes
        console.log('⏱️  Waiting for billing tick...');
        
        setTimeout(async () => {
          // Check if wallet was debited
          const updatedWallet = await Wallet.findOne({ userId: user._id });
          console.log('💰 Updated wallet balance:', updatedWallet?.balancePaise || 0, 'paise');
          
          // Stop the session
          await billingEngine.stopSession(sessionId, 'debug_test');
          console.log('🛑 Session stopped');
          
          process.exit(0);
        }, 20000); // Wait 20 seconds for a tick
        
      } catch (error) {
        console.log('❌ Error starting billing session:', error.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Debug error:', error);
    process.exit(1);
  }
}

// Run the debug
debugBilling(); 