import mongoose from 'mongoose';

const paiementFournisseurSchema = new mongoose.Schema({
  fournisseur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fournisseur',
    required: true
  },
  bonCommande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BonCommande'
  },
  montant: {
    type: Number,
    required: true,
    min: 0
  },
  datePaiement: {
    type: Date,
    default: Date.now
  },
  modePaiement: {
    type: String,
    enum: ['especes', 'cheque', 'virement', 'carte'],
    default: 'especes'
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
paiementFournisseurSchema.index({ fournisseur: 1, datePaiement: -1 });
paiementFournisseurSchema.index({ bonCommande: 1 });

export default mongoose.model('PaiementFournisseur', paiementFournisseurSchema);

