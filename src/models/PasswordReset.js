const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    token: { type: String, unique: true },
    expiresAt: Date,
    isUsed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

passwordResetSchema.index({ userId: 1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetSchema.index({ isUsed: 1 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
