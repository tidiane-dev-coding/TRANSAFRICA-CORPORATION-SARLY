import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import FactureSequence from '../models/FactureSequence.model.js';
import Shop from '../models/Shop.model.js';

dotenv.config();

const checkAllSequences = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Bahamadoutidiane622292370:Bahsow64@cluster0.niqycgy.mongodb.net/commerce_db';
        await mongoose.connect(mongoURI);

        const sequences = await FactureSequence.find();
        const shops = await Shop.find();

        let output = '=== ALL SEQUENCES ===\n';
        for (const seq of sequences) {
            const shop = shops.find(s => s._id.toString() === seq.shop.toString());
            output += `Shop: ${shop ? shop.nom : 'Unknown'} (${seq.shop})\n`;
            output += `  Year: ${seq.year}, Count: ${seq.count}\n`;
            output += `  Updated: ${seq.updatedAt}\n\n`;
        }

        fs.writeFileSync('all_sequences.txt', output);
        console.log('✅ Results written to all_sequences.txt');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkAllSequences();
