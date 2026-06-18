const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, trim: true, lowercase: true },
    slug: { type: String, unique: true, trim: true, lowercase: true },
    plan: {
      type: String,
      enum: ['free', 'starter', 'growth', 'enterprise'],
      default: 'free'
    },
    usageLimits: {
      leadsPerMonth: Number,
      exportsPerMonth: Number,
      apiCallsPerMonth: Number,
      maxUsers: Number
    },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: String,
        joinedAt: Date
      }
    ],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

organizationSchema.index({ domain: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
