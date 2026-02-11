import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Facture from '../models/Facture.model.js';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Bahamadoutidiane622292370:Bahsow64@cluster0.niqycgy.mongodb.net/commerce_db';
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const cleanIndexes = async () => {
  try {
    console.log('\n🧹 Cleaning Facture indexes...');

    // Get all indexes
    const indexes = await Facture.collection.getIndexes();
    console.log('Current indexes:', Object.keys(indexes));

    // Drop all indexes except _id_
    for (const indexName of Object.keys(indexes)) {
      if (indexName !== '_id_') {
        console.log(`  🗑️  Dropping index: ${indexName}`);
        await Facture.collection.dropIndex(indexName);
      }
    }

    console.log('\n🔄 Rebuilding indexes from schema...');
    await Facture.syncIndexes();

    console.log('\n✅ Index cleanup complete!');
    const newIndexes = await Facture.collection.getIndexes();
    console.log('New indexes:', Object.keys(newIndexes));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

connectDB().then(() => {
  cleanIndexes();
});
