const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
    deviceInfo: {
      ip: String,
      userAgent: String,
      device: String,
      browser: String,
      os: String
    }
  },
  { timestamps: true }
);

refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ isRevoked: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
