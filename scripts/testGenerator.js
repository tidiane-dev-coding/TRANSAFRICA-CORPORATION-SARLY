import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateFactureNumero } from '../utils/generateNumero.js';
import Facture from '../models/Facture.model.js';

dotenv.config();

const testGenerator = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Bahamadoutidiane622292370:Bahsow64@cluster0.niqycgy.mongodb.net/commerce_db';
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB for testing');

        const shopId = '69658754d60b265b857f15f3'; // From the error message

        console.log('🧪 Generating next invoice number...');
        const nextNumero = await generateFactureNumero(Facture, shopId);
        console.log(`✨ Generated Numero: ${nextNumero}`);

        // Check if it already exists
        const existing = await Facture.findOne({ numero: nextNumero, shop: shopId });
        if (existing) {
            console.error(`❌ COLLISION! ${nextNumero} already exists in database.`);
        } else {
            console.log(`✅ Success! ${nextNumero} is unique.`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
};

testGenerator();
