import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Facture from '../models/Facture.model.js';
import FactureSequence from '../models/FactureSequence.model.js';

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

const migrate = async () => {
  try {
    console.log('\n📋 Step 1: Checking for duplicate numeros...');

    // Find all factures
    const allFactures = await Facture.find().sort({ createdAt: 1 });
    console.log(`   Total factures: ${allFactures.length}`);

    // Group by numero + shop to find duplicates
    const groups = {};
    let duplicatesFound = 0;

    allFactures.forEach(f => {
      const key = `${f.numero}||${f.shop}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(f._id.toString());
    });

    // Delete duplicates (keep first, delete rest)
    for (const [key, ids] of Object.entries(groups)) {
      if (ids.length > 1) {
        const toDelete = ids.slice(1);
        console.log(`   ⚠️  Duplicate ${key}: deleting ${toDelete.length} copies`);
        await Facture.deleteMany({ _id: { $in: toDelete } });
        duplicatesFound += toDelete.length;
      }
    }
    console.log(`   ✅ Deleted ${duplicatesFound} duplicate factures\n`);

    console.log('📋 Step 2: Building sequences for each shop/year...');

    // Get unique shops and years
    const factures = await Facture.find().select('shop dateFacture numero').sort({ dateFacture: 1 });
    const sequences = {};

    factures.forEach(f => {
      const year = f.dateFacture.getFullYear();
      const key = `${f.shop}||${year}`;

      if (!sequences[key]) {
        sequences[key] = {
          shop: f.shop,
          year,
          count: 0
        };
      }
      sequences[key].count++;
    });

    console.log(`   Found ${Object.keys(sequences).length} shop/year combinations:`);
    for (const [key, seq] of Object.entries(sequences)) {
      console.log(`   - Shop ${seq.shop}, Year ${seq.year}: ${seq.count} factures`);

      // Create or update sequence
      await FactureSequence.findOneAndUpdate(
        { shop: seq.shop, year: seq.year },
        { count: seq.count },
        { upsert: true }
      );
    }
    console.log(`   ✅ Created/updated ${Object.keys(sequences).length} sequences\n`);

    console.log('📋 Step 3: Dropping old indexes...');
    try {
      await Facture.collection.dropIndex('numero_1');
      console.log('   ✅ Dropped index numero_1');
    } catch (e) {
      console.log('   ℹ️  Index numero_1 not found');
    }

    console.log('\n📋 Step 4: Rebuilding all indexes...');
    try {
      await Facture.collection.dropIndexes();
      console.log('   ✅ All old indexes dropped');
    } catch (e) {
      console.log('   ℹ️  No indexes to drop');
    }

    // Rebuild indexes by resyncing the schema
    await Facture.syncIndexes();
    console.log('   ✅ All indexes synced from schema\n');

    console.log('✅ Migration complete! You can now safely use the new sequence system.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

connectDB().then(() => {
  migrate();
});
