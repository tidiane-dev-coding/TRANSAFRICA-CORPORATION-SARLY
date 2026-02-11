import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shop from '../models/Shop.model.js';

// Load environment variables
dotenv.config();

const shops = [
  {
    nom: 'Boutique 1',
    adresse: 'Adresse Boutique 1',
    telephone: '+221 XX XXX XX XX',
    email: 'boutique1@example.com',
    ville: 'Dakar',
    codePostal: '12345',
    isActive: true
  },
  {
    nom: 'Boutique 2',
    adresse: 'Adresse Boutique 2',
    telephone: '+221 XX XXX XX XX',
    email: 'boutique2@example.com',
    ville: 'Dakar',
    codePostal: '12346',
    isActive: true
  },
  {
    nom: 'Boutique 3',
    adresse: 'Adresse Boutique 3',
    telephone: '+221 XX XXX XX XX',
    email: 'boutique3@example.com',
    ville: 'Dakar',
    codePostal: '12347',
    isActive: true
  }
];

const seedShops = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Bahamadoutidiane622292370:Bahsow64@cluster0.niqycgy.mongodb.net/commerce_db';
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connecté');

    // Clear existing shops (optional - comment out if you want to keep existing)
    // await Shop.deleteMany({});
    // console.log('🗑️  Boutiques existantes supprimées');

    // Check if shops already exist
    const existingShops = await Shop.find({});
    if (existingShops.length > 0) {
      console.log(`⚠️  ${existingShops.length} boutique(s) existante(s) trouvée(s).`);
      console.log('Boutiques existantes:');
      existingShops.forEach(shop => {
        console.log(`  - ${shop.nom} (ID: ${shop._id})`);
      });
      console.log('\nPour recréer les boutiques, supprimez-les d\'abord ou modifiez le script.');
      process.exit(0);
    }

    // Create shops
    console.log('\n📦 Création des boutiques...');
    const createdShops = await Shop.insertMany(shops);

    console.log(`\n✅ ${createdShops.length} boutique(s) créée(s) avec succès !\n`);
    createdShops.forEach((shop, index) => {
      console.log(`${index + 1}. ${shop.nom}`);
      console.log(`   ID: ${shop._id}`);
      console.log(`   Adresse: ${shop.adresse}`);
      console.log(`   Téléphone: ${shop.telephone}`);
      console.log(`   Email: ${shop.email}`);
      console.log('');
    });

    console.log('✨ Seed terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
};

// Run seed
seedShops();

