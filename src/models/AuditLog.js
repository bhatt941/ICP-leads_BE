const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    action: { type: String, required: true },
    collection: String,
    recordId: mongoose.Schema.Types.ObjectId,
    ipAddress: String,
    userAgent: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ organizationId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
