const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    designation: String,
    department: String,
    seniority: {
      type: String,
      enum: ['c_level', 'vp', 'director', 'manager', 'senior', 'mid', 'junior', 'unknown'],
      default: 'unknown'
    },
    linkedinUrl: String,
    email: String,
    phone: String,
    location: String,
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    companyName: String,
    sourceUrl: String,
    confidenceScore: { type: Number, default: 0 },
    verificationSource: String,
    confidence_score: { type: Number, default: 0 },
    verification_sources: [{ type: String }],
    verificationStatus: { type: String, enum: ['verified', 'low_confidence', 'rejected', 'unverified'], default: 'unverified' },
    verificationReasons: [{ type: String }],
    isLowConfidence: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date
  },
  { timestamps: true }
);

contactSchema.index({ organizationId: 1 });
contactSchema.index({ companyId: 1 });
contactSchema.index({ designation: 1 });
contactSchema.index({ seniority: 1 });
contactSchema.index({ department: 1 });
contactSchema.index({ linkedinUrl: 1 }, { sparse: true });
contactSchema.index({ email: 1 }, { sparse: true });

module.exports = mongoose.model('Contact', contactSchema);
