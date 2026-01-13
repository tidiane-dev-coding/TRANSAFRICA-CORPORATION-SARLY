import mongoose from 'mongoose';

const confieSchema = new mongoose.Schema({
  montantConfie: {
    type: Number,
    required: [true, 'Le montant confié est requis'],
    min: [0, 'Le montant doit être positif']
  },
  dateConfie: {
    type: Date,
    default: Date.now
  },
  beneficiaire: {
    type: String,
    required: [true, 'Le bénéficiaire est requis'],
    trim: true
  },
  motif: {
    type: String,
    trim: true
  },
  versements: [{
    montant: {
      type: Number,
      required: true,
      min: 0
    },
    dateVersement: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  soldeRestant: {
    type: Number,
    default: 0
  },
  statut: {
    type: String,
    enum: ['en_cours', 'rembourse'],
    default: 'en_cours'
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

// Calculate remaining balance
confieSchema.pre('save', function(next) {
  const totalVersements = this.versements.reduce((sum, v) => sum + v.montant, 0);
  this.soldeRestant = this.montantConfie - totalVersements;
  
  if (this.soldeRestant <= 0) {
    this.statut = 'rembourse';
  } else {
    this.statut = 'en_cours';
  }
  
  next();
});

// Index
confieSchema.index({ beneficiaire: 'text' });
confieSchema.index({ createdAt: -1 });

export default mongoose.model('Confie', confieSchema);

