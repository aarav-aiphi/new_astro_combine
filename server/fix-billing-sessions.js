const mongoose = require('mongoose');
const BillingSession = require('./models/billingSession.model');
require('dotenv').config();

async function fixBillingSessions() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    console.log('\n🔧 Fixing Invalid Billing Sessions');
    console.log('===================================\n');

    // 1. Find all billing sessions
    console.log('1. Checking all billing sessions...');
    const allSessions = await BillingSession.find({}).lean();
    console.log(`Found ${allSessions.length} total billing sessions`);

    // 2. Find sessions with missing required fields
    const invalidSessions = allSessions.filter(session => 
      !session.userId || 
      !session.astrologerId || 
      !session.ratePaisePerMin || 
      session.ratePaisePerMin <= 0
    );

    console.log(`Found ${invalidSessions.length} invalid sessions`);

    if (invalidSessions.length > 0) {
      console.log('\nInvalid sessions:');
      invalidSessions.forEach((session, index) => {
        console.log(`Session ${index + 1}:`);
        console.log(`  - _id: ${session._id}`);
        console.log(`  - userId: ${session.userId || 'MISSING'}`);
        console.log(`  - astrologerId: ${session.astrologerId || 'MISSING'}`);
        console.log(`  - ratePaisePerMin: ${session.ratePaisePerMin || 'MISSING'}`);
        console.log(`  - live: ${session.live}`);
      });

      // 3. Remove invalid sessions
      console.log('\n3. Removing invalid sessions...');
      const result = await BillingSession.deleteMany({
        $or: [
          { userId: { $exists: false } },
          { userId: null },
          { astrologerId: { $exists: false } },
          { astrologerId: null },
          { ratePaisePerMin: { $exists: false } },
          { ratePaisePerMin: null },
          { ratePaisePerMin: { $lte: 0 } }
        ]
      });

      console.log(`✅ Removed ${result.deletedCount} invalid billing sessions`);
    } else {
      console.log('✅ No invalid sessions found');
    }

    // 4. Check for duplicate active sessions
    console.log('\n4. Checking for duplicate active sessions...');
    const activeSessions = await BillingSession.find({ live: true }).lean();
    
    const userSessionCounts = {};
    activeSessions.forEach(session => {
      const userId = session.userId.toString();
      userSessionCounts[userId] = (userSessionCounts[userId] || 0) + 1;
    });

    const usersWithMultipleSessions = Object.entries(userSessionCounts)
      .filter(([userId, count]) => count > 1);

    if (usersWithMultipleSessions.length > 0) {
      console.log(`Found ${usersWithMultipleSessions.length} users with multiple active sessions`);
      
      for (const [userId, count] of usersWithMultipleSessions) {
        console.log(`\nUser ${userId} has ${count} active sessions`);
        const userSessions = await BillingSession.find({ 
          userId, 
          live: true 
        }).sort({ createdAt: -1 });

        // Keep the most recent session, deactivate the rest
        for (let i = 1; i < userSessions.length; i++) {
          await BillingSession.findByIdAndUpdate(userSessions[i]._id, { 
            live: false,
            endedAt: new Date()
          });
          console.log(`  ✅ Deactivated duplicate session ${userSessions[i]._id}`);
        }
      }
    } else {
      console.log('✅ No duplicate active sessions found');
    }

    // 5. Show final status
    console.log('\n5. Final billing sessions status:');
    const finalActiveSessions = await BillingSession.countDocuments({ live: true });
    const finalTotalSessions = await BillingSession.countDocuments({});
    
    console.log(`  - Active sessions: ${finalActiveSessions}`);
    console.log(`  - Total sessions: ${finalTotalSessions}`);

    console.log('\n🎉 Billing sessions cleanup completed!');

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

fixBillingSessions(); 