import mongoose from 'mongoose';

const bonCommandeSchema = new mongoose.Schema({
  numero: {
    type: String,
    unique: true,
    required: true
  },
  fournisseur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fournisseur',
    required: true
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
  statut: {
    type: String,
    enum: ['en_attente', 'confirme', 'livre', 'annule'],
    default: 'en_attente'
  },
  dateCommande: {
    type: Date,
    default: Date.now
  },
  dateLivraisonPrevue: {
    type: Date
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
bonCommandeSchema.index({ numero: 1 });
bonCommandeSchema.index({ fournisseur: 1, createdAt: -1 });
bonCommandeSchema.index({ statut: 1 });

export default mongoose.model('BonCommande', bonCommandeSchema);

