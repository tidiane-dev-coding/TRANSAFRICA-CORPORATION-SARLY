import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de la boutique est requis'],
    trim: true,
    unique: true
  },
  adresse: {
    type: String,
    trim: true
  },
  telephone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  ville: {
    type: String,
    trim: true
  },
  codePostal: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  logo: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index
shopSchema.index({ nom: 'text' });

export default mongoose.model('Shop', shopSchema);

