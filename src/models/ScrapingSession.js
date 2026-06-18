const mongoose = require('mongoose');

const scrapingSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sessionName: { type: String, trim: true, required: true },
    status: {
      type: String,
      enum: ['running', 'paused', 'completed', 'failed', 'stopped'],
      default: 'running'
    },
    country: String,
    industry: String,
    city: String,
    keywords: String,
    companySize: String,
    totalLeads: { type: Number, default: 0 },
    leadsToday: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    queueStatus: { type: String, default: 'queued' },
    startedAt: Date,
    endedAt: Date,
    lastActivityAt: Date,
    notes: String,
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

scrapingSessionSchema.index({ userId: 1, status: 1 });
scrapingSessionSchema.index({ startedAt: -1 });

module.exports = mongoose.model('ScrapingSession', scrapingSessionSchema);
