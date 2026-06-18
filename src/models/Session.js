const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ip: String,
    userAgent: String,
    device: String,
    browser: String,
    os: String,
    loginAt: Date,
    lastActiveAt: Date,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1 });
sessionSchema.index({ isActive: 1 });
sessionSchema.index({ lastActiveAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);
