import mongoose from 'mongoose';

const bonLivraisonSchema = new mongoose.Schema({
  numero: {
    type: String,
    unique: true,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  facture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facture'
  },
  articles: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantite: {
      type: Number,
      required: true,
      min: 1
    },
    prixUnitaire: {
      type: Number,
      required: true,
      min: 0
    },
    montant: {
      type: Number,
      required: true
    }
  }],
  montantTotal: {
    type: Number,
    required: true,
    min: 0
  },
  dateLivraison: {
    type: Date,
    default: Date.now
  },
  transporteur: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  }
}, {
  timestamps: true
});

// Index
bonLivraisonSchema.index({ numero: 1 });
bonLivraisonSchema.index({ client: 1, createdAt: -1 });
bonLivraisonSchema.index({ facture: 1 });

export default mongoose.model('BonLivraison', bonLivraisonSchema);

