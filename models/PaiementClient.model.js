import mongoose from 'mongoose';

const paiementClientSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  facture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facture'
  },
  montant: {
    type: Number,
    required: true,
    min: 0
  },
  datePaiement: {
    type: Date,
    default: Date.now
  },
  modePaiement: {
    type: String,
    enum: ['especes', 'cheque', 'virement', 'carte', 'orange_money', 'mobile_money'],
    default: 'especes'
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
paiementClientSchema.index({ client: 1, datePaiement: -1 });
paiementClientSchema.index({ facture: 1 });

export default mongoose.model('PaiementClient', paiementClientSchema);

