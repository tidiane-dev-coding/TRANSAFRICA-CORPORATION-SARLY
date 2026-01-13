import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';

// Import routes
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import stockRoutes from './routes/stock.routes.js';
import clientRoutes from './routes/client.routes.js';
import fournisseurRoutes from './routes/fournisseur.routes.js';
import factureRoutes from './routes/facture.routes.js';
import bonCommandeRoutes from './routes/bonCommande.routes.js';
import bonLivraisonRoutes from './routes/bonLivraison.routes.js';
import confieRoutes from './routes/confie.routes.js';
import inventaireRoutes from './routes/inventaire.routes.js';
import depenseRoutes from './routes/depense.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import shopRoutes from './routes/shop.routes.js';
import userRoutes from './routes/user.routes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (logos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/fournisseurs', fournisseurRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/bons-commande', bonCommandeRoutes);
app.use('/api/bons-livraison', bonLivraisonRoutes);
app.use('/api/confie', confieRoutes);
app.use('/api/inventaire', inventaireRoutes);
app.use('/api/depenses', depenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/commerce_db';
    console.log('🔄 Tentative de connexion à MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Vérifiez que MongoDB est en cours d\'exécution');
    // Ne pas quitter le processus en développement pour voir les autres erreurs
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Keep-alive (anti-sommeil) ping
const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL || `http://localhost:${PORT}/api/health`;

const pingUrl = async (url) => {
  try {
    if (typeof fetch === 'function') {
      const res = await fetch(url);
      console.log(`🟢 Keep-alive ping to ${url} — status ${res.status}`);
    } else {
      const lib = url.startsWith('https') ? https : http;
      lib.get(url, (res) => {
        console.log(`🟢 Keep-alive ping to ${url} — status ${res.statusCode}`);
      }).on('error', (err) => {
        console.error('⚠️ Keep-alive error:', err.message);
      });
    }
  } catch (err) {
    console.error('⚠️ Keep-alive failed:', err.message);
  }
};

// Ping immediately and then every 5 minutes
pingUrl(KEEP_ALIVE_URL);
setInterval(() => pingUrl(KEEP_ALIVE_URL), 5 * 60 * 1000);

