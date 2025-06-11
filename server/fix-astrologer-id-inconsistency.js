const mongoose = require('mongoose');
const Chat = require('./chat/models/chat.model');
const User = require('./models/user.model');
const Astrologer = require('./models/astrologer.model');
const BillingSession = require('./models/billingSession.model');
require('dotenv').config();

async function fixAstrologerIdInconsistency() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    console.log('\n🔧 Fixing Astrologer ID Inconsistency');
    console.log('====================================\n');

    // 1. First, let's identify what we have
    console.log('1. Current state analysis...');
    const chats = await Chat.find({}).lean();
    const astrologers = await Astrologer.find({}).lean();
    const astrologerUsers = await User.find({ role: 'Astrologer' }).lean();

    console.log(`- Total chats: ${chats.length}`);
    console.log(`- Astrologer records: ${astrologers.length}`);
    console.log(`- Users with Astrologer role: ${astrologerUsers.length}\n`);

    // 2. Create missing astrologer records for users with Astrologer role
    console.log('2. Creating missing astrologer records...');
    
    for (const astrologerUser of astrologerUsers) {
      // Check if astrologer record exists
      const existingAstrologer = await Astrologer.findOne({ 
        userId: astrologerUser._id 
      });
      
      if (!existingAstrologer) {
        console.log(`Creating astrologer record for user: ${astrologerUser.name} (${astrologerUser._id})`);
        
        const newAstrologer = new Astrologer({
          userId: astrologerUser._id,
          name: astrologerUser.name,
          ratePaisePerMin: 1000, // Default rate
          ratePaisePerMinChat: 2500, // Default chat rate
          ratePaisePerMinCall: 3000, // Default call rate
          isAvailable: true,
          specialties: ['General'],
          experience: 1
        });
        
        await newAstrologer.save();
        console.log(`✅ Created astrologer record: ${newAstrologer._id}`);
      } else {
        console.log(`✅ Astrologer record already exists for: ${astrologerUser.name}`);
      }
    }

    // 3. Standardize chat astrologer references
    console.log('\n3. Standardizing chat astrologer references...');
    
    for (const chat of chats) {
      console.log(`\nProcessing chat ${chat._id}:`);
      console.log(`  Current astrologerId: ${chat.astrologerId}`);
      
      // Check if current astrologerId points to Astrologer collection
      let astrologer = await Astrologer.findById(chat.astrologerId);
      
      if (!astrologer) {
        // Try to find astrologer by userId (current ID might be user ID)
        astrologer = await Astrologer.findOne({ userId: chat.astrologerId });
        
        if (astrologer) {
          console.log(`  Found astrologer by userId, updating to use astrologer._id`);
          console.log(`  Old: ${chat.astrologerId} -> New: ${astrologer._id}`);
          
          // Update chat to use astrologer._id instead of user._id
          await Chat.findByIdAndUpdate(chat._id, {
            astrologerId: astrologer._id
          });
          
          console.log(`  ✅ Updated chat ${chat._id} astrologerId`);
        } else {
          console.log(`  ❌ No astrologer found for ID: ${chat.astrologerId}`);
          
          // Check if this ID is a user with Astrologer role
          const user = await User.findById(chat.astrologerId);
          if (user && user.role === 'Astrologer') {
            console.log(`  Found user with Astrologer role: ${user.name}`);
            
            // Create astrologer record for this user
            const newAstrologer = new Astrologer({
              userId: user._id,
              name: user.name,
              ratePaisePerMin: 1000,
              ratePaisePerMinChat: 2500,
              ratePaisePerMinCall: 3000,
              isAvailable: true,
              specialties: ['General'],
              experience: 1
            });
            
            await newAstrologer.save();
            console.log(`  ✅ Created new astrologer record: ${newAstrologer._id}`);
            
            // Update chat to use new astrologer._id
            await Chat.findByIdAndUpdate(chat._id, {
              astrologerId: newAstrologer._id
            });
            
            console.log(`  ✅ Updated chat to use new astrologer._id`);
          }
        }
      } else {
        console.log(`  ✅ Chat already uses correct astrologer._id`);
      }
    }

    // 4. Fix active billing sessions
    console.log('\n4. Fixing active billing sessions...');
    const activeSessions = await BillingSession.find({ live: true });
    
    for (const session of activeSessions) {
      console.log(`\nProcessing session ${session._id}:`);
      console.log(`  astrologerId: ${session.astrologerId}`);
      
      // Check if astrologer exists
      let astrologer = await Astrologer.findById(session.astrologerId);
      
      if (!astrologer) {
        console.log(`  Astrologer not found by _id, checking by userId...`);
        astrologer = await Astrologer.findOne({ userId: session.astrologerId });
        
        if (astrologer) {
          console.log(`  Found astrologer by userId, updating session`);
          await BillingSession.findByIdAndUpdate(session._id, {
            astrologerId: astrologer._id
          });
          console.log(`  ✅ Updated session astrologerId`);
        } else {
          console.log(`  ❌ No astrologer found, ending invalid session`);
          await BillingSession.findByIdAndUpdate(session._id, {
            live: false,
            endedAt: new Date()
          });
          console.log(`  ✅ Ended invalid billing session`);
        }
      } else {
        console.log(`  ✅ Session has valid astrologer reference`);
      }
    }

    // 5. Final verification
    console.log('\n5. Final verification...');
    const updatedChats = await Chat.find({}).lean();
    const finalActiveSessions = await BillingSession.find({ live: true }).lean();
    
    let validChats = 0;
    let invalidChats = 0;
    
    for (const chat of updatedChats) {
      const astrologer = await Astrologer.findById(chat.astrologerId);
      if (astrologer) {
        validChats++;
      } else {
        invalidChats++;
        console.log(`  ❌ Still invalid: Chat ${chat._id} -> astrologerId ${chat.astrologerId}`);
      }
    }
    
    console.log(`\nFinal Results:`);
    console.log(`- Valid chats: ${validChats}/${updatedChats.length}`);
    console.log(`- Invalid chats: ${invalidChats}/${updatedChats.length}`);
    console.log(`- Active billing sessions: ${finalActiveSessions.length}`);
    
    // Verify all active sessions have valid astrologers
    for (const session of finalActiveSessions) {
      const astrologer = await Astrologer.findById(session.astrologerId);
      console.log(`- Session ${session._id}: astrologer ${astrologer ? '✅ VALID' : '❌ INVALID'}`);
    }

    console.log('\n🎉 Astrologer ID inconsistency fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Fix interrupted');
  await mongoose.disconnect();
  process.exit(0);
});

fixAstrologerIdInconsistency(); 