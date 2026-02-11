import mongoose from 'mongoose';

const factureSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
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
  montantPaye: {
    type: Number,
    default: 0,
    min: 0
  },
  montantRestant: {
    type: Number,
    default: 0
  },
  statut: {
    type: String,
    enum: ['paye', 'non_paye', 'partiel'],
    default: 'non_paye'
  },
  dateFacture: {
    type: Date,
    default: Date.now
  },
  dateEcheance: {
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

// Indexes - combination of numero and shop (no longer unique to avoid hard crashes)
factureSchema.index({ numero: 1, shop: 1 });
factureSchema.index({ client: 1, createdAt: -1 });
factureSchema.index({ statut: 1 });

// Calculate remaining amount
factureSchema.pre('save', function(next) {
  this.montantRestant = this.montantTotal - this.montantPaye;
  
  if (this.montantRestant <= 0) {
    this.statut = 'paye';
  } else if (this.montantPaye > 0) {
    this.statut = 'partiel';
  } else {
    this.statut = 'non_paye';
  }
  
  next();
});

export default mongoose.model('Facture', factureSchema);

