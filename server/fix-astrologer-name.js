const mongoose = require('mongoose');
const Astrologer = require('./models/astrologer.model');
const User = require('./models/user.model');
require('dotenv').config();

async function updateAstrologerName() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');
    
    const astrologer = await Astrologer.findById('6847a95047dda6bedf875460');
    const user = await User.findById('6847a95047dda6bedf87545e');
    
    if (astrologer && user) {
      astrologer.name = user.name;
      await astrologer.save();
      console.log('✅ Updated astrologer name to:', user.name);
    } else {
      console.log('❌ Astrologer or user not found');
    }
    
    await mongoose.disconnect();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

updateAstrologerName(); 