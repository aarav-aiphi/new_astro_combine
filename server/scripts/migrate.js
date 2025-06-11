const mongoose = require('mongoose');
const Wallet = require('../models/wallet.model.js');

async function migrateWalletIndexes() {
  try {
    console.log('🔄 Starting wallet index migration...');
    
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yourDatabaseName');
      console.log('📦 Connected to MongoDB');
    }
    
    // Try to drop the old index (might not exist on fresh DBs)
    try {
      await Wallet.collection.dropIndex('history.transactionId_1');
      console.log('🗑️  Dropped old history.transactionId_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Old index did not exist - this is normal for fresh databases');
      } else {
        console.log('⚠️  Error dropping old index:', error.message);
      }
    }
    
    // Rebuild indexes with the new partial index definition
    await Wallet.init();
    console.log('✅ Rebuilt wallet indexes with partial transactionId index');
    
    // Verify the new index exists
    const indexes = await Wallet.collection.indexes();
    const transactionIdIndex = indexes.find(idx => 
      idx.key && idx.key['history.transactionId'] === 1
    );
    
    if (transactionIdIndex && transactionIdIndex.partialFilterExpression) {
      console.log('✅ Verified partial index created successfully');
      console.log('   Filter:', JSON.stringify(transactionIdIndex.partialFilterExpression));
    } else {
      console.log('❌ Partial index not found - please check the model definition');
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateWalletIndexes()
    .then(() => {
      console.log('🏁 Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateWalletIndexes }; 