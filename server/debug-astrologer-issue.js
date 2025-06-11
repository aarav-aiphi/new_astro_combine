const mongoose = require('mongoose');
require('dotenv').config();

async function debugAstrologerIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('🔗 Connected to database');
    
    const Astrologer = require('./models/astrologer.model');
    const User = require('./models/user.model');
    const Chat = require('./chat/models/chat.model');
    
    const chatAstrologerId = '6847a95047dda6bedf87545e';
    
    console.log('\n🔍 Debugging astrologer issue...');
    
    // Check all astrologers
    const allAstrologers = await Astrologer.find();
    console.log(`📋 Total astrologers in DB: ${allAstrologers.length}`);
    
    allAstrologers.forEach((a, i) => {
      console.log(`${i+1}. Astrologer ID: ${a._id}`);
      console.log(`   User ID: ${a.userId}`);
      console.log(`   Chat Rate: ${a.ratePaisePerMinChat || a.ratePaisePerMin || 'Not set'}`);
      console.log('');
    });
    
    // Check if there's a user with the chat astrologer ID
    const userWithChatId = await User.findById(chatAstrologerId);
    console.log(`👤 User with chat astrologer ID (${chatAstrologerId}):`, userWithChatId ? 'EXISTS' : 'NOT FOUND');
    
    // Check if there's an astrologer with the chat astrologer ID as userId
    const astrologerWithChatUserId = await Astrologer.findOne({ userId: chatAstrologerId });
    console.log(`🔮 Astrologer with userId=${chatAstrologerId}:`, astrologerWithChatUserId ? 'EXISTS' : 'NOT FOUND');
    
    // Check if there's an astrologer with the chat astrologer ID as _id
    const astrologerWithChatId = await Astrologer.findById(chatAstrologerId);
    console.log(`🔮 Astrologer with _id=${chatAstrologerId}:`, astrologerWithChatId ? 'EXISTS' : 'NOT FOUND');
    
    console.log('\n🔧 Proposed Solution:');
    
    if (astrologerWithChatUserId && !astrologerWithChatUserId.ratePaisePerMinChat) {
      console.log('✅ Found astrologer but missing chat rate - will update it');
      
      astrologerWithChatUserId.ratePaisePerMinChat = 2500; // ₹25/min
      astrologerWithChatUserId.ratePaisePerMin = astrologerWithChatUserId.ratePaisePerMin || 3000; // ₹30/min
      await astrologerWithChatUserId.save();
      
      console.log('✅ Updated astrologer rates');
      console.log(`   Chat Rate: ₹${astrologerWithChatUserId.ratePaisePerMinChat/100}/min`);
      console.log(`   Default Rate: ₹${astrologerWithChatUserId.ratePaisePerMin/100}/min`);
      
    } else if (!astrologerWithChatUserId && !astrologerWithChatId) {
      console.log('❌ Need to create astrologer record');
      
      // Get the first existing astrologer to use as a template
      const templateAstrologer = allAstrologers[0];
      if (templateAstrologer) {
        console.log('📋 Using existing astrologer as template');
        
        // Update the chat to use the existing astrologer
        const chat = await Chat.findOne({ astrologerId: chatAstrologerId });
        if (chat) {
          console.log(`🔄 Updating chat to use existing astrologer ${templateAstrologer._id}`);
          chat.astrologerId = templateAstrologer._id;
          await chat.save();
          console.log('✅ Chat updated');
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    process.exit(0);
  }
}

debugAstrologerIssue(); 