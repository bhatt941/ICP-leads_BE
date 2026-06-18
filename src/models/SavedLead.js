const mongoose = require('mongoose');

const savedLeadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    companyName: { type: String, trim: true },
    industry: String,
    country: String,
    city: String,
    website: String,
    linkedinUrl: String,
    executiveName: String,
    designation: String,
    aiOpportunityScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    verificationStatus: { type: String, enum: ['verified', 'low_confidence', 'rejected', 'unverified'], default: 'unverified' },
    verificationReasons: [{ type: String }],
    isLowConfidence: { type: Boolean, default: false },
    hiringStatus: { type: String, default: 'unknown' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'interested', 'not_interested', 'archived'],
      default: 'new'
    },
    saved: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    notes: String,
    tags: [{ type: String, trim: true }],
    source: String,
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapingSession' },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

savedLeadSchema.index({ userId: 1, status: 1 });
savedLeadSchema.index({ companyName: 1 });
savedLeadSchema.index({ aiOpportunityScore: -1 });

module.exports = mongoose.model('SavedLead', savedLeadSchema);
