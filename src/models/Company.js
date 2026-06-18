const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    website: { type: String, unique: true, sparse: true, trim: true },
    email: String,
    phone: String,
    linkedinCompanyUrl: { type: String, unique: true, sparse: true, trim: true },
    industry: { type: String, trim: true },
    subIndustry: { type: String, trim: true },
    description: String,
    headcount: Number,
    foundedYear: Number,
    careersUrl: String,
    address: String,
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    technologyStack: [{ type: String, trim: true }],
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String,
      youtube: String
    },
    hiringStatus: { type: String, enum: ['active', 'inactive', 'unknown'], default: 'unknown' },
    hiringIntensity: { type: Number, default: 0 },
    leadScore: { type: Number, default: 0 },
    leadGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'unscored'], default: 'unscored' },
    discoverySource: String,
    sourceUrl: String,
    isEnriched: { type: Boolean, default: false },
    lastTechnologyScannedAt: Date,
    confidenceScore: { type: Number, default: 0 },
    verificationSource: String,
    verificationStatus: { type: String, enum: ['verified', 'low_confidence', 'rejected', 'unverified'], default: 'unverified' },
    verificationReasons: [{ type: String }],
    isLowConfidence: { type: Boolean, default: false },
    growthSignal: String,
    specialties: [{ type: String, trim: true }],
    sector: { type: String, trim: true },
    company_size: { type: String, trim: true },
    employee_count: { type: Number, default: 0 },
    location: {
      country: { type: String, trim: true },
      region: { type: String, trim: true },
      state: { type: String, trim: true },
      city: { type: String, trim: true }
    },
    hiring: {
      hiring_status: { type: String, default: 'Unknown' },
      hiring_velocity: { type: String, trim: true },
      open_roles: [{ type: String, trim: true }],
      departments_hiring: [{ type: String, trim: true }]
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    apolloOrgId: { type: String, trim: true }
  },
  { timestamps: true }
);

companySchema.index({ companyName: 1 });
companySchema.index({ organizationId: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ country: 1 });
companySchema.index({ leadScore: 1 });
companySchema.index({ technologyStack: 1 });
companySchema.index({ hiringStatus: 1 });
companySchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Company', companySchema);
