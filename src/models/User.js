const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const env = require('../config/env');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: ['super_admin', 'org_owner', 'admin', 'manager', 'sales_user', 'read_only'],
      default: 'sales_user'
    },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    googleId: String,
    avatar: String,
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: String,
    lastLoginAt: Date
  },
  { timestamps: true }
);

userSchema.index({ organizationId: 1 });

userSchema.virtual('fullName').get(function fullName() {
  return [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash')) return next();
  if (this.passwordHash && !this.passwordHash.startsWith('$2')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, env.bcryptSaltRounds);
  }
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
