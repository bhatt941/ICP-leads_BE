const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    keyHash: { type: String, unique: true },
    keyPrefix: String,
    scopes: [String],
    isActive: { type: Boolean, default: true },
    lastUsedAt: Date,
    usageCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

apiKeySchema.index({ organizationId: 1 });
apiKeySchema.index({ userId: 1 });
apiKeySchema.index({ isActive: 1 });

module.exports = mongoose.model('ApiKey', apiKeySchema);
