import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Facture from '../models/Facture.model.js';

dotenv.config();

const checkGaps = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Bahamadoutidiane622292370:Bahsow64@cluster0.niqycgy.mongodb.net/commerce_db';
        await mongoose.connect(mongoURI);

        const shopId = '69658754d60b265b857f15f3';

        // Find ALL factures for this shop in 2026
        const factures = await Facture.find({
            shop: shopId,
            numero: /^FACT-2026-/
        }).select('numero').sort({ numero: 1 });

        console.log(`Found ${factures.length} total factures for 2026.`);

        const nums = factures.map(f => {
            const parts = f.numero.split('-');
            return parseInt(parts[2], 10);
        }).filter(n => !isNaN(n));

        const max = Math.max(...nums);
        console.log(`Max numerical part found: ${max}`);

        // Find any number that exists
        const existingSet = new Set(nums);
        console.log(`Unique numerical parts: ${Array.from(existingSet).sort((a, b) => a - b).join(', ')}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkGaps();
