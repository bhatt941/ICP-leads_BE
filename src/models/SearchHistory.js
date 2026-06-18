const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    query: String,
    filters: mongoose.Schema.Types.Mixed,
    resultCount: Number,
    collectionName: String
  },
  { timestamps: true }
);

searchHistorySchema.index({ organizationId: 1 });
searchHistorySchema.index({ userId: 1 });
searchHistorySchema.index({ collectionName: 1 });
searchHistorySchema.index({ createdAt: 1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
