import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Facture from '../models/Facture.model.js';
import FactureSequence from '../models/FactureSequence.model.js';

dotenv.config();

const diagnose = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Bahamadoutidiane622292370:Bahsow64@cluster0.niqycgy.mongodb.net/commerce_db';
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected');

        let output = '';
        const log = (msg) => {
            console.log(msg);
            output += msg + '\n';
        };

        const shopId = '69658754d60b265b857f15f3'; // From user error
        const year = 2026;

        log(`\n🔍 Checking FactureSequence for Shop: ${shopId}, Year: ${year}`);
        const seq = await FactureSequence.findOne({ shop: shopId, year });
        log(`FactureSequence: ${seq ? JSON.stringify(seq, null, 2) : 'NOT FOUND'}`);

        log(`\n🔍 Checking Factures for Shop: ${shopId} starting with FACT-2026-`);
        const factures = await Facture.find({
            shop: shopId,
            numero: /^FACT-2026-/
        }).sort({ numero: -1 }).limit(30);

        log(`Found ${factures.length} recent factures:`);
        factures.forEach(f => {
            log(`  - ${f.numero} (ID: ${f._id}, Date: ${f.dateFacture})`);
        });

        // Check specifically for FACT-2026-0073 and FACT-2026-00073
        const f73 = await Facture.findOne({ shop: shopId, numero: 'FACT-2026-0073' });
        const f00073 = await Facture.findOne({ shop: shopId, numero: 'FACT-2026-00073' });

        log(`\nPresence check:`);
        log(`- FACT-2026-0073: ${f73 ? 'EXISTS' : 'NO'}`);
        log(`- FACT-2026-00073: ${f00073 ? 'EXISTS' : 'NO'}`);

        fs.writeFileSync('diag_output.txt', output);
        console.log('✅ Results written to diag_output.txt');

        process.exit(0);
    } catch (error) {
        console.error('❌ Diagnosis failed:', error);
        process.exit(1);
    }
};

diagnose();
