const mongoose = require('mongoose');

const filterOptionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      enum: ['sector', 'industry', 'location', 'department', 'seniority']
    },
    value: { type: String, required: true }
  },
  { timestamps: true }
);

filterOptionSchema.index({ key: 1, value: 1 }, { unique: true });

module.exports = mongoose.model('FilterOption', filterOptionSchema);
