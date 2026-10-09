const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  mark: { type: Number, default: 0 },
  whomark: String,
  adminComment: {
    type: String,
    default: '',
  },
});

const fileSubmissionSchema = new mongoose.Schema({
  markingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marking',
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  file: Array,
  score: {
    type: [scoreSchema],
    default: [], // <-- DEFAULT BO'SH MASSIV BIRIKTIRILDI
  },
  totalScore:{ type: Number, default: 0 },
});

const applicationSchema = new mongoose.Schema(
  {
    periodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Period',
      required: true,
    },
    studentId: String,
    status: {
      type: String,
      enum: ['draft', 'submitted', 'reviewed'],
      default: 'draft',
    },
    files: [fileSubmissionSchema],
    totalScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StpApplication', applicationSchema);