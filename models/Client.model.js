import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du client est requis'],
    trim: true
  },
  prenom: {
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
  solde: {
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
clientSchema.index({ nom: 'text', prenom: 'text', email: 'text' });

export default mongoose.model('Client', clientSchema);

