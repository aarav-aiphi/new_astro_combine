const mongoose = require('mongoose');
const BillingSession = require('./models/billingSession.model');
require('dotenv').config();

async function fixBillingSessionsStartedAt() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    console.log('\n🔧 Fixing Billing Sessions startedAt Timestamps');
    console.log('===============================================\n');

    // Find active sessions with missing startedAt
    const sessionsToFix = await BillingSession.find({ 
      live: true,
      $or: [
        { startedAt: { $exists: false } },
        { startedAt: null },
        { startedAt: undefined }
      ]
    });

    console.log(`Found ${sessionsToFix.length} sessions needing startedAt fix\n`);

    for (const session of sessionsToFix) {
      console.log(`Fixing session ${session._id}:`);
      console.log(`  - Current startedAt: ${session.startedAt}`);
      console.log(`  - userId: ${session.userId}`);
      console.log(`  - astrologerId: ${session.astrologerId}`);
      
      // Set startedAt to current time (or use createdAt if available)
      const startedAt = session.createdAt || new Date();
      
      await BillingSession.findByIdAndUpdate(session._id, {
        startedAt: startedAt,
        lastTickAt: null, // Reset to allow first tick
        totalPaiseDeducted: 0, // Reset deduction counter
        duration: 0 // Reset duration
      });
      
      console.log(`  ✅ Updated startedAt to: ${startedAt}`);
      console.log('');
    }

    // Verify the fix
    console.log('Verifying fixes...');
    const fixedSessions = await BillingSession.find({ live: true });
    
    let allFixed = true;
    for (const session of fixedSessions) {
      const hasValidStartedAt = session.startedAt && !isNaN(new Date(session.startedAt).getTime());
      console.log(`Session ${session._id}: startedAt ${hasValidStartedAt ? '✅ VALID' : '❌ INVALID'}`);
      if (!hasValidStartedAt) allFixed = false;
    }

    if (allFixed) {
      console.log('\n✅ All active sessions now have valid startedAt timestamps!');
    } else {
      console.log('\n❌ Some sessions still have invalid startedAt timestamps');
    }

    console.log('\n🎉 Fix completed!');

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

fixBillingSessionsStartedAt(); 