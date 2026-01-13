import mongoose from 'mongoose';

const depenseSchema = new mongoose.Schema({
  montant: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0, 'Le montant doit être positif']
  },
  categorie: {
    type: String,
    required: [true, 'La catégorie est requise'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dateDepense: {
    type: Date,
    default: Date.now
  },
  modePaiement: {
    type: String,
    enum: ['especes', 'cheque', 'virement', 'carte'],
    default: 'especes'
  },
  beneficiaire: {
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
depenseSchema.index({ dateDepense: -1 });
depenseSchema.index({ categorie: 1 });
depenseSchema.index({ createdAt: -1 });

export default mongoose.model('Depense', depenseSchema);

