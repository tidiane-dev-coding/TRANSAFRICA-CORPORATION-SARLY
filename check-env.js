// Script pour vérifier la configuration de l'environnement
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔍 Vérification de la configuration...\n');

const requiredVars = ['JWT_SECRET', 'MONGODB_URI'];
let hasErrors = false;

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ ${varName} n'est pas défini`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName} est défini`);
  }
});

if (hasErrors) {
  console.log('\n💡 Créez un fichier .env dans le dossier backend/ avec :');
  console.log('PORT=5000');
  console.log('MONGODB_URI=mongodb://localhost:27017/commerce_db');
  console.log('JWT_SECRET=votre_cle_secrete_ici');
  console.log('JWT_EXPIRE=7d');
  console.log('NODE_ENV=development');
  process.exit(1);
} else {
  console.log('\n✅ Configuration OK!');
}

