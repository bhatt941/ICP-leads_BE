const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    sourceUrl: { type: String, required: true },
    verificationSource: { type: String, required: true },
    confidenceScore: { type: Number, required: true },
    entityType: { type: String, required: true, enum: ['Company', 'Contact'] },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

auditSchema.index({ entityType: 1, entityId: 1 });
auditSchema.index({ confidenceScore: 1 });
auditSchema.index({ verificationSource: 1 });

module.exports = mongoose.model('Audit', auditSchema);
