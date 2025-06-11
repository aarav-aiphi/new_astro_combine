const mongoose = require('mongoose');
require('dotenv').config();

async function checkAstrologers() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('🔗 Connected to database');
    
    const Astrologer = require('./models/astrologer.model');
    const astrologers = await Astrologer.find().select('_id name email ratePaisePerMin ratePaisePerMinChat specializations');
    
    console.log(`\n📋 Available astrologers: ${astrologers.length}`);
    
    if (astrologers.length === 0) {
      console.log('❌ No astrologers found in database');
    } else {
      astrologers.forEach((a, i) => {
        console.log(`${i+1}. ${a.name} (${a._id})`);
        console.log(`   Email: ${a.email}`);
        console.log(`   Chat Rate: ${a.ratePaisePerMinChat || 'Not set'} paise/min`);
        console.log(`   Call Rate: ${a.ratePaisePerMin || 'Not set'} paise/min`);
        console.log(`   Specializations: ${a.specializations?.length || 0}`);
        console.log('');
      });
    }
    
    // Check the specific astrologer from the chat
    const chatAstrologerId = '6847a95047dda6bedf87545e';
    const specificAstrologer = await Astrologer.findById(chatAstrologerId);
    console.log(`🔍 Looking for astrologer ${chatAstrologerId}:`);
    console.log(specificAstrologer ? '✅ Found!' : '❌ Not found');
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAstrologers(); 