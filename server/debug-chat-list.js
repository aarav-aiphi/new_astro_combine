const mongoose = require('mongoose');
const Chat = require('./chat/models/chat.model');
const User = require('./models/user.model');
require('dotenv').config();

async function debugChatList() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Test user ID (user account)
    const testUserId = '6847a95047dda6bedf87545e';
    
    console.log('\n🔍 Debugging Chat List Data');
    console.log('============================\n');

    // 1. Check if user exists
    console.log('1. Checking user existence...');
    const user = await User.findById(testUserId);
    if (user) {
      console.log(`✅ User found: ${user.name} (${user.email}) - Role: ${user.role}`);
    } else {
      console.log('❌ User not found');
      return;
    }

    // 2. Check raw chat data
    console.log('\n2. Checking raw chat data...');
    const rawChats = await Chat.find({ 
      $or: [{ userId: testUserId }, { astrologerId: testUserId }] 
    }).lean();
    
    console.log(`Found ${rawChats.length} raw chats:`);
    rawChats.forEach((chat, index) => {
      console.log(`Chat ${index + 1}:`);
      console.log(`  - _id: ${chat._id}`);
      console.log(`  - userId: ${chat.userId} (type: ${typeof chat.userId})`);
      console.log(`  - astrologerId: ${chat.astrologerId} (type: ${typeof chat.astrologerId})`);
    });

    // 3. Check populated chat data
    console.log('\n3. Checking populated chat data...');
    const populatedChats = await Chat.find({ 
      $or: [{ userId: testUserId }, { astrologerId: testUserId }] 
    })
    .populate('userId', '_id name avatar')
    .populate('astrologerId', '_id name avatar')
    .lean();

    console.log(`Found ${populatedChats.length} populated chats:`);
    populatedChats.forEach((chat, index) => {
      console.log(`Chat ${index + 1}:`);
      console.log(`  - _id: ${chat._id}`);
      console.log(`  - userId:`, chat.userId);
      console.log(`  - astrologerId:`, chat.astrologerId);
      
      if (!chat.userId) {
        console.log('  ⚠️ WARNING: userId is null/undefined');
      }
      if (!chat.astrologerId) {
        console.log('  ⚠️ WARNING: astrologerId is null/undefined');
      }
    });

    // 4. Check if referenced users exist
    console.log('\n4. Checking referenced users...');
    for (const chat of rawChats) {
      if (chat.userId) {
        const userDoc = await User.findById(chat.userId);
        if (!userDoc) {
          console.log(`❌ User ${chat.userId} referenced in chat ${chat._id} does not exist`);
        } else {
          console.log(`✅ User ${chat.userId} exists: ${userDoc.name}`);
        }
      }
      
      if (chat.astrologerId) {
        const astrologerDoc = await User.findById(chat.astrologerId);
        if (!astrologerDoc) {
          console.log(`❌ Astrologer ${chat.astrologerId} referenced in chat ${chat._id} does not exist`);
        } else {
          console.log(`✅ Astrologer ${chat.astrologerId} exists: ${astrologerDoc.name}`);
        }
      }
    }

    console.log('\n🎉 Chat list debugging completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Debug interrupted');
  await mongoose.disconnect();
  process.exit(0);
});

debugChatList(); 