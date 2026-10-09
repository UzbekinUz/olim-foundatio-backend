const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true, // Masalan: "2026-Bahor bosqichi"
      trim: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
    }
  },
  { timestamps: true }
);

periodSchema.index(
  { status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

module.exports = mongoose.model('Period', periodSchema);