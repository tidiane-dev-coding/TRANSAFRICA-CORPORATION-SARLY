import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    enum: ['entree', 'sortie'],
    required: true
  },
  quantite: {
    type: Number,
    required: true,
    min: [1, 'La quantité doit être positive']
  },
  prixUnitaire: {
    type: Number,
    required: true,
    min: 0
  },
  montantTotal: {
    type: Number,
    required: true
  },
  motif: {
    type: String,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  // Pour les sorties liées à une vente
  facture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facture'
  },
  // Pour les entrées liées à un bon de commande
  bonCommande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BonCommande'
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
stockMovementSchema.index({ product: 1, createdAt: -1 });

export default mongoose.model('StockMovement', stockMovementSchema);

