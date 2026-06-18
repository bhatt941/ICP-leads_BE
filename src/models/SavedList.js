const mongoose = require('mongoose');

const savedListSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    companyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
    contactIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

savedListSchema.index({ organizationId: 1 });
savedListSchema.index({ userId: 1 });
savedListSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('SavedList', savedListSchema);
