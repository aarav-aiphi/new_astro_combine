const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('🔗 Connected to database');
    
    const Chat = require('./chat/models/chat.model');
    const User = require('./models/user.model');
    const Astrologer = require('./models/astrologer.model');
    const Wallet = require('./models/wallet.model');
    const BillingSession = require('./models/billingSession.model');
    
    console.log('\n🔍 Checking latest chat data...');
    
    // Get the latest chat
    const chat = await Chat.findOne().sort({ createdAt: -1 });
    if (!chat) {
      console.log('❌ No chats found');
      process.exit(0);
    }
    
    console.log('📞 Latest Chat:', {
      id: chat._id.toString(),
      userId: chat.userId.toString(),
      astrologerId: chat.astrologerId.toString(),
      createdAt: chat.createdAt
    });
    
    // Check user
    const user = await User.findById(chat.userId);
    console.log('👤 User:', user ? {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    } : '❌ Not found');
    
    // Check astrologer (try both lookup methods)
    let astrologer = await Astrologer.findById(chat.astrologerId);
    if (!astrologer) {
      astrologer = await Astrologer.findOne({ userId: chat.astrologerId });
    }
    console.log('🔮 Astrologer:', astrologer ? {
      id: astrologer._id.toString(),
      userId: astrologer.userId.toString(),
      ratePaisePerMin: astrologer.ratePaisePerMin,
      ratePaisePerMinChat: astrologer.ratePaisePerMinChat
    } : '❌ Not found');
    
    // Check user wallet
    const wallet = await Wallet.findOne({ userId: chat.userId });
    console.log('💰 User Wallet:', wallet ? {
      balance: wallet.balancePaise,
      userId: wallet.userId.toString()
    } : '❌ Not found');
    
    // Check for any existing billing sessions
    const billingSession = await BillingSession.findOne({ userId: chat.userId, live: true });
    console.log('⚡ Active Billing Session:', billingSession ? {
      id: billingSession._id.toString(),
      userId: billingSession.userId.toString(),
      astrologerId: billingSession.astrologerId.toString(),
      ratePaisePerMin: billingSession.ratePaisePerMin,
      secondsElapsed: billingSession.secondsElapsed,
      live: billingSession.live
    } : '❌ None found');
    
    console.log('\n✅ Data check complete');
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    process.exit(0);
  }
}

checkData(); 