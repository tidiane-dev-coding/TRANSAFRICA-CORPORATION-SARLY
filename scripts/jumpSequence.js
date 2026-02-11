import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FactureSequence from '../models/FactureSequence.model.js';

dotenv.config();

const jumpSequence = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/commerce_db';
        await mongoose.connect(mongoURI);

        const shopId = '69658754d60b265b857f15f3';
        const year = 2026;

        console.log(`🚀 Jumping sequence for Shop: ${shopId}, Year: ${year} to 100`);

        const result = await FactureSequence.findOneAndUpdate(
            { shop: shopId, year },
            { count: 100 },
            { upsert: true, new: true }
        );

        console.log('✅ Result:', JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

jumpSequence();
