const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    companyName: String,
    description: String,
    location: String,
    city: String,
    country: String,
    workplaceType: { type: String, enum: ['remote', 'hybrid', 'onsite', 'unknown'], default: 'unknown' },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'internship', 'unknown'],
      default: 'unknown'
    },
    jobUrl: String,
    sourcePlatform: String,
    postedDate: Date,
    posted_date: Date,
    hiring_status: { type: String, default: 'active' },
    expiresDate: Date,
    technologyKeywords: [{ type: String, trim: true, index: true }],
    requiredSkills: [{ type: String, trim: true }],
    industry: String,
    department: String,
    experienceMin: Number,
    experienceMax: Number,
    salaryMin: Number,
    salaryMax: Number,
    currency: String,
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date
  },
  { timestamps: true }
);

jobSchema.index({ organizationId: 1 });
jobSchema.index({ companyId: 1 });
jobSchema.index({ title: 1 });
jobSchema.index({ industry: 1 });
jobSchema.index({ country: 1 });
jobSchema.index({ workplaceType: 1 });
jobSchema.index({ postedDate: 1 });
jobSchema.index({ requiredSkills: 1 });

module.exports = mongoose.model('Job', jobSchema);
