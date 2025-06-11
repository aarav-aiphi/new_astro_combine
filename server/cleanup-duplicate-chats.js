const mongoose = require('mongoose');
const Chat = require('./chat/models/chat.model');
const User = require('./models/user.model');
const Astrologer = require('./models/astrologer.model');
const BillingSession = require('./models/billingSession.model');
require('dotenv').config();

async function cleanupDuplicateChats() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    console.log('\n🧹 Cleaning Up Duplicate Chats and Fixing Astrologer IDs');
    console.log('======================================================\n');

    // 1. Find and remove invalid chats (those with non-existent astrologers)
    console.log('1. Removing invalid chats...');
    const chats = await Chat.find({}).lean();
    let removedChats = 0;
    let validChats = 0;

    for (const chat of chats) {
      // Check if astrologer exists in either collection
      const astrologerExists = await Astrologer.findById(chat.astrologerId);
      const astrologerByUserId = await Astrologer.findOne({ userId: chat.astrologerId });
      const userExists = await User.findById(chat.astrologerId);
      
      if (!astrologerExists && !astrologerByUserId && (!userExists || userExists.role !== 'Astrologer')) {
        console.log(`Removing invalid chat ${chat._id} (astrologerId: ${chat.astrologerId})`);
        await Chat.findByIdAndDelete(chat._id);
        removedChats++;
      } else {
        validChats++;
      }
    }

    console.log(`✅ Removed ${removedChats} invalid chats`);
    console.log(`✅ Kept ${validChats} valid chats\n`);

    // 2. Handle the specific duplicate case
    console.log('2. Handling duplicate chat issue...');
    
    // Find chats between user 6847a93447dda6bedf875457 and astrologer 6847a95047dda6bedf87545e
    const duplicateChats = await Chat.find({
      userId: new mongoose.Types.ObjectId('6847a93447dda6bedf875457'),
      $or: [
        { astrologerId: new mongoose.Types.ObjectId('6847a95047dda6bedf87545e') },
        { astrologerId: new mongoose.Types.ObjectId('6847a95047dda6bedf875460') }
      ]
    }).sort({ createdAt: 1 }); // Sort by creation date

    console.log(`Found ${duplicateChats.length} chats between this user and astrologer`);

    if (duplicateChats.length > 1) {
      // Keep the most recent chat, remove others
      const chatToKeep = duplicateChats[duplicateChats.length - 1];
      const chatsToRemove = duplicateChats.slice(0, -1);
      
      console.log(`Keeping chat: ${chatToKeep._id} (most recent)`);
      
      for (const chatToRemove of chatsToRemove) {
        console.log(`Removing duplicate chat: ${chatToRemove._id}`);
        await Chat.findByIdAndDelete(chatToRemove._id);
      }
      
      // Update the kept chat to use correct astrologer._id
      await Chat.findByIdAndUpdate(chatToKeep._id, {
        astrologerId: new mongoose.Types.ObjectId('6847a95047dda6bedf875460')
      });
      
      console.log(`✅ Updated kept chat to use astrologer._id: 6847a95047dda6bedf875460`);
    }

    // 3. Fix any remaining active billing sessions
    console.log('\n3. Fixing active billing sessions...');
    const activeSessions = await BillingSession.find({ live: true });
    
    for (const session of activeSessions) {
      console.log(`Checking session ${session._id}:`);
      console.log(`  astrologerId: ${session.astrologerId}`);
      
      // If this is the problematic user ID reference, fix it
      if (session.astrologerId.toString() === '6847a95047dda6bedf87545e') {
        console.log(`  Updating to use astrologer._id instead of user._id`);
        await BillingSession.findByIdAndUpdate(session._id, {
          astrologerId: new mongoose.Types.ObjectId('6847a95047dda6bedf875460')
        });
        console.log(`  ✅ Updated session astrologerId`);
      } else {
        // Check if astrologer exists
        const astrologer = await Astrologer.findById(session.astrologerId);
        if (!astrologer) {
          console.log(`  ❌ Invalid astrologer reference, ending session`);
          await BillingSession.findByIdAndUpdate(session._id, {
            live: false,
            endedAt: new Date()
          });
        } else {
          console.log(`  ✅ Valid astrologer reference`);
        }
      }
    }

    // 4. Final verification
    console.log('\n4. Final verification...');
    const finalChats = await Chat.find({}).lean();
    const finalActiveSessions = await BillingSession.find({ live: true }).lean();
    
    console.log(`\nFinal state:`);
    console.log(`- Total chats: ${finalChats.length}`);
    console.log(`- Active billing sessions: ${finalActiveSessions.length}`);
    
    // Check all chats have valid astrologers
    let validFinalChats = 0;
    let invalidFinalChats = 0;
    
    for (const chat of finalChats) {
      const astrologer = await Astrologer.findById(chat.astrologerId);
      if (astrologer) {
        validFinalChats++;
      } else {
        invalidFinalChats++;
        console.log(`  ❌ Invalid chat: ${chat._id} -> astrologerId ${chat.astrologerId}`);
      }
    }
    
    console.log(`- Valid chats: ${validFinalChats}`);
    console.log(`- Invalid chats: ${invalidFinalChats}`);
    
    // Check all active sessions have valid astrologers
    for (const session of finalActiveSessions) {
      const astrologer = await Astrologer.findById(session.astrologerId);
      console.log(`- Session ${session._id}: astrologer ${astrologer ? '✅ VALID' : '❌ INVALID'}`);
    }

    console.log('\n🎉 Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Cleanup interrupted');
  await mongoose.disconnect();
  process.exit(0);
});

cleanupDuplicateChats(); 