import mongoose from 'mongoose';

const inventaireSchema = new mongoose.Schema({
  dateInventaire: {
    type: Date,
    default: Date.now
  },
  produits: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    stockTheorique: {
      type: Number,
      required: true
    },
    stockReel: {
      type: Number,
      required: true
    },
    ecart: {
      type: Number,
      required: true
    },
    valeurStock: {
      type: Number,
      required: true
    }
  }],
  valeurTotale: {
    type: Number,
    required: true
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
inventaireSchema.index({ dateInventaire: -1 });

export default mongoose.model('Inventaire', inventaireSchema);

