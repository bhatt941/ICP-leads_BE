const mongoose = require('mongoose');

const mfaSecretSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    secret: String,
    isActive: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MfaSecret', mfaSecretSchema);
