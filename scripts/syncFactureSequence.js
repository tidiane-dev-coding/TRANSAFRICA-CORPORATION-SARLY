import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Facture from '../models/Facture.model.js';
import FactureSequence from '../models/FactureSequence.model.js';

dotenv.config();

const syncSequences = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Bahamadoutidiane622292370:Bahsow64@cluster0.niqycgy.mongodb.net/commerce_db';
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected');

        // Get all unique shop and year combinations from factures
        const aggregations = await Facture.aggregate([
            {
                $project: {
                    shop: 1,
                    year: { $year: "$dateFacture" },
                    numero: 1
                }
            },
            {
                $group: {
                    _id: { shop: "$shop", year: "$year" },
                    maxNumero: { $max: "$numero" }
                }
            }
        ]);

        console.log(`📊 Found ${aggregations.length} shop/year combinations to sync.`);

        for (const agg of aggregations) {
            const { shop, year } = agg._id;
            const maxNumeroStr = agg.maxNumero;

            // Extract number from FACT-YYYY-XXXXX or FACT-YYYY-XXXX
            const parts = maxNumeroStr.split('-');
            if (parts.length < 3) continue;

            const count = parseInt(parts[2], 10);

            if (!isNaN(count)) {
                console.log(`🔧 Syncing shop ${shop}, year ${year}: max counter found is ${count} (from ${maxNumeroStr})`);

                await FactureSequence.findOneAndUpdate(
                    { shop, year },
                    { count },
                    { upsert: true, new: true }
                );
            }
        }

        console.log('\n✅ Synchronization complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during synchronization:', error);
        process.exit(1);
    }
};

syncSequences();
