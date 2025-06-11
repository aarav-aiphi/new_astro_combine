const mongoose = require('mongoose');
const Astrologer = require('./models/astrologer.model');

// Load environment variables
require('dotenv').config();

console.log('🔌 Connecting to MongoDB...');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function fixAstrologerRates() {
  try {
    console.log('🔧 Checking astrologer rates...');
    
    // First, let's see how many astrologers we have total
    const totalAstrologers = await Astrologer.countDocuments();
    console.log(`📊 Total astrologers in database: ${totalAstrologers}`);
    
    // Find astrologers missing ratePaisePerMin or having 0/null values
    const astrologers = await Astrologer.find({
      $or: [
        { ratePaisePerMin: { $exists: false } },
        { ratePaisePerMin: { $lte: 0 } },
        { ratePaisePerMin: null }
      ]
    });

    console.log(`Found ${astrologers.length} astrologers needing rate fixes`);

    if (astrologers.length === 0) {
      console.log('✅ All astrologers already have valid rates!');
      return;
    }

    for (const astrologer of astrologers) {
      let newRate;
      
      if (astrologer.costPerMinute && astrologer.costPerMinute > 0) {
        // Convert rupees to paise (multiply by 100)
        newRate = astrologer.costPerMinute * 100;
      } else {
        // Default rate: ₹30/min = 3000 paise/min
        newRate = 3000;
      }

      await Astrologer.updateOne(
        { _id: astrologer._id },
        { 
          $set: { 
            ratePaisePerMin: newRate,
            ratePaisePerMinChat: newRate, // Same rate for chat
            ratePaisePerMinCall: newRate  // Same rate for call
          }
        }
      );

      console.log(`✅ Updated astrologer ${astrologer._id}: ₹${newRate/100}/min (${newRate} paise/min)`);
    }

    console.log('🎉 All astrologer rates updated successfully!');
    
    // Verify the fix
    const fixedCount = await Astrologer.countDocuments({
      ratePaisePerMin: { $gt: 0 }
    });
    
    console.log(`📊 Total astrologers with valid rates: ${fixedCount}`);
    
  } catch (error) {
    console.error('❌ Error fixing astrologer rates:', error);
  } finally {
    console.log('🔌 Closing database connection...');
    mongoose.connection.close();
  }
}

// Wait for connection
mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
  fixAstrologerRates();
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
}); 