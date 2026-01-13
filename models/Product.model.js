import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true
  },
  categorie: {
    type: String,
    required: [true, 'La catégorie est requise'],
    trim: true
  },
  prixAchat: {
    type: Number,
    required: [true, 'Le prix d\'achat est requis'],
    min: [0, 'Le prix d\'achat doit être positif']
  },
  prixVente: {
    type: Number,
    required: [true, 'Le prix de vente est requis'],
    min: [0, 'Le prix de vente doit être positif']
  },
  stockActuel: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  seuilMinimum: {
    type: Number,
    required: [true, 'Le seuil minimum est requis'],
    min: [0, 'Le seuil minimum doit être positif'],
    default: 0
  },
  unite: {
    type: String,
    default: 'unité'
  },
  description: {
    type: String,
    trim: true
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

// Index for search
productSchema.index({ nom: 'text', categorie: 'text' });

// Virtual for alert
productSchema.virtual('isLowStock').get(function() {
  return this.stockActuel <= this.seuilMinimum;
});

export default mongoose.model('Product', productSchema);

