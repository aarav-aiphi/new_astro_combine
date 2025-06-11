const mongoose = require('mongoose');
const Chat = require('./chat/models/chat.model');
const User = require('./models/user.model');
const Astrologer = require('./models/astrologer.model');
const BillingSession = require('./models/billingSession.model');
require('dotenv').config();

async function debugAstrologerIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    console.log('\n🔍 Debugging Astrologer ID Relationships');
    console.log('==========================================\n');

    // 1. Check all chats and their astrologer IDs
    console.log('1. Analyzing chat astrologer IDs...');
    const chats = await Chat.find({}).lean();
    console.log(`Found ${chats.length} chats\n`);

    for (const chat of chats) {
      console.log(`Chat ${chat._id}:`);
      console.log(`  - userId: ${chat.userId}`);
      console.log(`  - astrologerId: ${chat.astrologerId}`);
      console.log(`  - astrologerId type: ${typeof chat.astrologerId}`);
      
      // Check if astrologer ID exists in User collection
      const astrologerUser = await User.findById(chat.astrologerId);
      console.log(`  - astrologer in User collection: ${astrologerUser ? '✅ FOUND' : '❌ NOT FOUND'}`);
      if (astrologerUser) {
        console.log(`    - name: ${astrologerUser.name}`);
        console.log(`    - role: ${astrologerUser.role}`);
      }
      
      // Check if astrologer ID exists in Astrologer collection (direct lookup)
      const astrologerDirect = await Astrologer.findById(chat.astrologerId);
      console.log(`  - astrologer in Astrologer collection (by _id): ${astrologerDirect ? '✅ FOUND' : '❌ NOT FOUND'}`);
      if (astrologerDirect) {
        console.log(`    - name: ${astrologerDirect.name}`);
        console.log(`    - userId: ${astrologerDirect.userId}`);
        console.log(`    - ratePaisePerMin: ${astrologerDirect.ratePaisePerMin}`);
        console.log(`    - ratePaisePerMinChat: ${astrologerDirect.ratePaisePerMinChat}`);
      }
      
      // Check if astrologer exists by userId field
      const astrologerByUserId = await Astrologer.findOne({ userId: chat.astrologerId });
      console.log(`  - astrologer in Astrologer collection (by userId): ${astrologerByUserId ? '✅ FOUND' : '❌ NOT FOUND'}`);
      if (astrologerByUserId) {
        console.log(`    - name: ${astrologerByUserId.name}`);
        console.log(`    - _id: ${astrologerByUserId._id}`);
        console.log(`    - ratePaisePerMin: ${astrologerByUserId.ratePaisePerMin}`);
        console.log(`    - ratePaisePerMinChat: ${astrologerByUserId.ratePaisePerMinChat}`);
      }
      
      console.log('');
    }

    // 2. Check all astrologers and their relationships
    console.log('\n2. Analyzing astrologer records...');
    const astrologers = await Astrologer.find({}).lean();
    console.log(`Found ${astrologers.length} astrologers\n`);

    for (const astrologer of astrologers) {
      console.log(`Astrologer ${astrologer._id}:`);
      console.log(`  - name: ${astrologer.name}`);
      console.log(`  - userId: ${astrologer.userId}`);
      console.log(`  - ratePaisePerMin: ${astrologer.ratePaisePerMin}`);
      console.log(`  - ratePaisePerMinChat: ${astrologer.ratePaisePerMinChat}`);
      
      // Check if corresponding user exists
      if (astrologer.userId) {
        const correspondingUser = await User.findById(astrologer.userId);
        console.log(`  - corresponding user: ${correspondingUser ? '✅ FOUND' : '❌ NOT FOUND'}`);
        if (correspondingUser) {
          console.log(`    - name: ${correspondingUser.name}`);
          console.log(`    - role: ${correspondingUser.role}`);
        }
      }
      
      // Check chats where this astrologer ID is referenced
      const chatsWithThisAstrologer = await Chat.countDocuments({ astrologerId: astrologer._id });
      const chatsWithThisUserId = await Chat.countDocuments({ astrologerId: astrologer.userId });
      console.log(`  - chats referencing this astrologer._id: ${chatsWithThisAstrologer}`);
      console.log(`  - chats referencing this astrologer.userId: ${chatsWithThisUserId}`);
      
      console.log('');
    }

    // 3. Test billing session startup logic for each chat
    console.log('\n3. Testing billing session startup logic...');
    
    for (const chat of chats) {
      console.log(`\nTesting chat ${chat._id}:`);
      
      try {
        // Simulate the billing session startup logic
        console.log(`  - Looking up astrologer by _id: ${chat.astrologerId}`);
        let astrologer = await Astrologer.findById(chat.astrologerId);
        
        if (!astrologer) {
          console.log(`  - Direct lookup failed, trying by userId...`);
          astrologer = await Astrologer.findOne({ userId: chat.astrologerId });
        }
        
        if (!astrologer) {
          console.log(`  - ❌ FAILED: No astrologer found for ID ${chat.astrologerId}`);
          continue;
        }
        
        console.log(`  - ✅ Found astrologer: ${astrologer.name}`);
        
        // Check rates
        const ratePaisePerMin = astrologer.ratePaisePerMinChat || astrologer.ratePaisePerMin;
        if (!ratePaisePerMin) {
          console.log(`  - ❌ FAILED: No rate available (ratePaisePerMinChat: ${astrologer.ratePaisePerMinChat}, ratePaisePerMin: ${astrologer.ratePaisePerMin})`);
        } else {
          console.log(`  - ✅ Rate available: ${ratePaisePerMin} paise/min`);
        }
        
        // Check if billing session would be valid
        console.log(`  - astrologerId for session: ${chat.astrologerId.toString()}`);
        console.log(`  - ✅ Billing session startup would SUCCEED`);
        
      } catch (error) {
        console.log(`  - ❌ ERROR in billing session startup: ${error.message}`);
      }
    }

    // 4. Check active billing sessions
    console.log('\n4. Checking active billing sessions...');
    const activeSessions = await BillingSession.find({ live: true }).lean();
    console.log(`Found ${activeSessions.length} active billing sessions\n`);
    
    for (const session of activeSessions) {
      console.log(`Session ${session._id}:`);
      console.log(`  - userId: ${session.userId}`);
      console.log(`  - astrologerId: ${session.astrologerId}`);
      console.log(`  - ratePaisePerMin: ${session.ratePaisePerMin}`);
      console.log(`  - sessionType: ${session.sessionType}`);
      console.log(`  - live: ${session.live}`);
      
      // Verify astrologer exists
      const astrologer = await Astrologer.findById(session.astrologerId);
      console.log(`  - astrologer exists: ${astrologer ? '✅ YES' : '❌ NO'}`);
      
      console.log('');
    }

    // 5. Recommendations
    console.log('\n5. RECOMMENDATIONS:');
    
    // Check for inconsistent astrologer ID usage
    const chatsUsingUserIds = [];
    const chatsUsingAstrologerIds = [];
    
    for (const chat of chats) {
      const directLookup = await Astrologer.findById(chat.astrologerId);
      const userIdLookup = await Astrologer.findOne({ userId: chat.astrologerId });
      
      if (directLookup) chatsUsingAstrologerIds.push(chat._id);
      if (userIdLookup) chatsUsingUserIds.push(chat._id);
    }
    
    console.log(`- Chats using astrologer._id: ${chatsUsingAstrologerIds.length}`);
    console.log(`- Chats using user._id: ${chatsUsingUserIds.length}`);
    
    if (chatsUsingUserIds.length > 0 && chatsUsingAstrologerIds.length > 0) {
      console.log('⚠️  INCONSISTENT: Some chats use astrologer._id, others use user._id');
      console.log('   Recommend standardizing to use astrologer._id');
    }

    console.log('\n🎉 Analysis completed!');

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

debugAstrologerIds(); 