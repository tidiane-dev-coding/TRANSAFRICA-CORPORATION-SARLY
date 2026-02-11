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

const cleanupDuplicates = async () => {
  try {
    // Find all factures
    const factures = await Facture.find().sort({ createdAt: -1 });
    console.log(`📋 Total factures: ${factures.length}`);

    // Group by numero and shop
    const groups = {};
    factures.forEach(f => {
      const key = `${f.numero}||${f.shop._id || f.shop}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(f);
    });

    // Find duplicates
    let duplicatesFound = 0;
    for (const [key, group] of Object.entries(groups)) {
      if (group.length > 1) {
        console.log(`\n⚠️  Duplicate found: ${key} (${group.length} copies)`);
        // Keep the first (oldest), delete the rest
        const toDelete = group.slice(1);
        for (const doc of toDelete) {
          console.log(`   🗑️  Deleting (created: ${doc.createdAt})`);
          await Facture.deleteOne({ _id: doc._id });
          duplicatesFound++;
        }
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${duplicatesFound} duplicate factures`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
};

connectDB().then(() => {
  cleanupDuplicates();
});
