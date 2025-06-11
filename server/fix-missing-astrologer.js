const mongoose = require('mongoose');
require('dotenv').config();

async function fixMissingAstrologer() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('🔗 Connected to database');
    
    const Astrologer = require('./models/astrologer.model');
    const User = require('./models/user.model');
    const Wallet = require('./models/wallet.model');
    
    const missingAstrologerId = '6847a95047dda6bedf87545e';
    
    // Check if astrologer already exists
    const existingAstrologer = await Astrologer.findById(missingAstrologerId);
    if (existingAstrologer) {
      console.log('✅ Astrologer already exists');
      process.exit(0);
    }
    
    console.log('🔨 Creating missing astrologer...');
    
    // First, check if there's a user for this astrologer
    let astrologerUser = await User.findById(missingAstrologerId);
    
    if (!astrologerUser) {
      // Create a user for the astrologer
      astrologerUser = new User({
        _id: new mongoose.Types.ObjectId(missingAstrologerId),
        name: 'Dr. Priya Sharma',
        email: 'priya.sharma@jyotish.com',
        password: '$2b$10$hashedpassword', // This would be properly hashed in real scenario
        phone: '+919876543210',
        role: 'astrologer',
        isVerified: true
      });
      
      await astrologerUser.save();
      console.log('👤 Created astrologer user');
    }
    
    // Create the astrologer profile
    const newAstrologer = new Astrologer({
      _id: new mongoose.Types.ObjectId(missingAstrologerId),
      userId: astrologerUser._id,
      tag: null,
      verification: 'verified',
      specializations: [],
      languages: ['Hindi', 'English'],
      experience: 8,
      costPerMinute: 30, // Legacy field
      ratePaisePerMin: 3000, // ₹30/min = 3000 paise/min
      ratePaisePerMinChat: 2500, // ₹25/min for chat
      ratePaisePerMinCall: 3500, // ₹35/min for calls
      chatMinutes: 0,
      callMinutes: 0,
      chatStatus: 'online',
      callStatus: 'online',
      about: 'Experienced Vedic astrologer specializing in life guidance, career counseling, and relationship advice. With 8+ years of practice in traditional astrology.',
      totalConsultations: 150
    });
    
    await newAstrologer.save();
    console.log('🔮 Created astrologer profile');
    
    // Create a wallet for the astrologer
    const existingWallet = await Wallet.findOne({ userId: astrologerUser._id });
    if (!existingWallet) {
      const astrologerWallet = new Wallet({
        userId: astrologerUser._id,
        balancePaise: 0,
        history: []
      });
      
      await astrologerWallet.save();
      console.log('💰 Created astrologer wallet');
    }
    
    console.log('✅ Successfully created missing astrologer');
    console.log(`   ID: ${newAstrologer._id}`);
    console.log(`   Name: ${astrologerUser.name}`);
    console.log(`   Chat Rate: ₹${newAstrologer.ratePaisePerMinChat/100}/min`);
    console.log(`   Call Rate: ₹${newAstrologer.ratePaisePerMinCall/100}/min`);
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    process.exit(0);
  }
}

fixMissingAstrologer(); 