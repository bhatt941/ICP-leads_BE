const mongoose = require('mongoose');

const leadScoreSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', unique: true },
    signals: {
      ceoFound: Boolean,
      ctoFound: Boolean,
      hiringEngineers: Boolean,
      hiringAiTalent: Boolean,
      usesAws: Boolean,
      usesSalesforce: Boolean,
      usesHubspot: Boolean,
      activeCareerPage: Boolean,
      largeHeadcount: Boolean
    },
    scores: {
      hiringScore: Number,
      growthScore: Number,
      technologyScore: Number,
      decisionMakerScore: Number,
      totalScore: Number
    },
    grade: { type: String, enum: ['A', 'B', 'C', 'D'] },
    gradedAt: Date
  },
  { timestamps: true }
);

leadScoreSchema.index({ organizationId: 1 });

module.exports = mongoose.model('LeadScore', leadScoreSchema);
