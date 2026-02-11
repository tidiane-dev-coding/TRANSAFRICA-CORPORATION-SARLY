import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Facture from '../models/Facture.model.js';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Bahamadoutidiane622292370:Bahsow64@cluster0.niqycgy.mongodb.net/commerce_dbmongodb://localhost:27017/commerce_db';
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, { 
      serverSelectionTimeoutMS: 5000 
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const fixIndexWarning = async () => {
  try {
    console.log('\n🔍 Checking Facture indexes...');
    
    // Drop ALL indexes and rebuild from scratch
    console.log('🚀 Dropping ALL indexes...');
    try {
      const indexes = await Facture.collection.getIndexes();
      console.log('Current indexes:', Object.keys(indexes));
      
      for (const indexName of Object.keys(indexes)) {
        if (indexName !== '_id_') {
          await Facture.collection.dropIndex(indexName);
          console.log(`   ✅ Dropped: ${indexName}`);
        }
      }
    } catch (e) {
      console.log('   (No custom indexes found)');
    }
    
    // Clear Mongoose index cache
    console.log('\n🧹 Clearing Mongoose index cache...');
    Facture.$__collection._lazyConnecting = false;
    
    console.log('\n🔄 Rebuilding indexes from schema...');
    await Facture.syncIndexes();
    
    const finalIndexes = await Facture.collection.getIndexes();
    console.log('\n✅ Final indexes:', Object.keys(finalIndexes));
    
    console.log('\n✅ Done! The warning should be gone.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

connectDB().then(() => {
  fixIndexWarning();
});
