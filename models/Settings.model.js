import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  boutiqueName: {
    type: String,
    default: 'Gestion Commerciale',
    trim: true
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
    trim: true
  },
  ville: {
    type: String,
    trim: true
  },
  codePostal: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.model('Settings', settingsSchema);

