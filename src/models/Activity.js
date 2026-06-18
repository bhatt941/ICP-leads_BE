const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    type: {
      type: String,
      enum: ['discovery', 'enrichment', 'people_found', 'job_found', 'tech_detected', 'scored']
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

activitySchema.index({ organizationId: 1 });
activitySchema.index({ companyId: 1 });
activitySchema.index({ type: 1 });

module.exports = mongoose.model('Activity', activitySchema);
