import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Facture from '../models/Facture.model.js';

dotenv.config();

const connectDB = async () => {
  try {
    mongodb
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Bahamadoutidiane622292370:Bahsow64@cluster0.niqycgy.mongodb.net/commerce_db';
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const fixFactures = async () => {
  try {
    // List all factures with numero FACT-2026-0073
    const duplicates = await Facture.find({ numero: 'FACT-2026-0073' }).sort({ createdAt: -1 });
    console.log(`\n📋 Found ${duplicates.length} factures with numero FACT-2026-0073`);

    if (duplicates.length > 1) {
      // Keep the first one, delete the rest
      const toDelete = duplicates.slice(1);
      for (const doc of toDelete) {
        console.log(`   🗑️  Deleting duplicate (ID: ${doc._id}, created: ${doc.createdAt})`);
        await Facture.deleteOne({ _id: doc._id });
      }
      console.log(`✅ Deleted ${toDelete.length} duplicates`);
    }

    // Now drop the old index and rebuild
    console.log('\n🔧 Dropping and rebuilding indexes...');
    try {
      await Facture.collection.dropIndex('numero_1');
      console.log('   ✅ Dropped old index numero_1');
    } catch (e) {
      console.log('   ℹ️  Index numero_1 not found, continuing...');
    }

    // Rebuild indexes from schema
    await Facture.collection.dropIndexes().catch(() => { });
    await Facture.collection.createIndexes();
    console.log('✅ Indexes rebuilt');

    // Show all factures with numero starting with FACT-2026
    const allFactures = await Facture.find({ numero: /^FACT-2026/ }).select('numero createdAt').sort({ numero: 1 });
    console.log(`\n📊 All FACT-2026 factures (${allFactures.length} total):`);
    allFactures.forEach(f => {
      console.log(`   - ${f.numero} (${f.createdAt})`);
    });

    console.log('\n✅ Fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during fix:', error.message);
    process.exit(1);
  }
};

connectDB().then(() => {
  fixFactures();
});
