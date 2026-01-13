import mongoose from 'mongoose';

const fournisseurSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du fournisseur est requis'],
    trim: true
  },
  contact: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  telephone: {
    type: String,
    trim: true
  },
  adresse: {
    type: String,
    trim: true
  },
  ville: {
    type: String,
    trim: true
  },
  codePostal: {
    type: String,
    trim: true
  },
  dette: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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
fournisseurSchema.index({ nom: 'text', email: 'text' });

export default mongoose.model('Fournisseur', fournisseurSchema);

