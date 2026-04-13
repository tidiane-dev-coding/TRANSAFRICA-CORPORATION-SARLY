import mongoose from 'mongoose';

const fournitureArticleSchema = new mongoose.Schema({
  designation: {
    type: String,
    required: true,
    trim: true
  },
  quantite: {
    type: Number,
    required: true,
    min: 0.000001
  },
  prixUnitaire: {
    type: Number,
    required: true,
    min: 0
  },
  montant: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const fournitureFournisseurSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    trim: true
  },
  fournisseur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fournisseur',
    required: true
  },
  articles: {
    type: [fournitureArticleSchema],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'Au moins un article est requis'
    }
  },
  modeFourniture: {
    type: String,
    trim: true,
    default: ''
  },
  prixDouaniere: {
    type: Number,
    default: 0,
    min: 0
  },
  montantTotal: {
    type: Number,
    required: true,
    min: 0
  },
  montantTotalAvecDouane: {
    type: Number,
    required: true,
    min: 0
  },
  dateFourniture: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    default: ''
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
}, { timestamps: true });

fournitureFournisseurSchema.index({ fournisseur: 1, createdAt: -1 });
fournitureFournisseurSchema.index({ numero: 1, shop: 1 });

export default mongoose.model('FournitureFournisseur', fournitureFournisseurSchema);

