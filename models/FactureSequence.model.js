import mongoose from 'mongoose';

const sequenceSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Unique combination of shop + year
sequenceSchema.index({ shop: 1, year: 1 }, { unique: true });

export default mongoose.model('FactureSequence', sequenceSchema);
