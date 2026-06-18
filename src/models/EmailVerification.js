const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    token: { type: String, unique: true },
    expiresAt: Date,
    isUsed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

emailVerificationSchema.index({ userId: 1 });
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
emailVerificationSchema.index({ isUsed: 1 });

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
