const mongoose = require('mongoose');

const tutorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    headline: {
      type: String,
      default: '',
      trim: true,
    },
    qualification: {
      type: String,
      default: '',
      trim: true,
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    subjects: {
      type: [String],
      default: [],
    },
    classLevels: {
      type: [String],
      default: [],
    },
    area: {
      type: String,
      default: '',
      trim: true,
    },
    hourlyRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    online: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    documents: {
      type: [String],
      default: [],
    },
    ratingAvg: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

tutorProfileSchema.index({ subjects: 1 });
tutorProfileSchema.index({ area: 1 });
tutorProfileSchema.index({ verified: 1, hourlyRate: 1 });

module.exports = mongoose.model('TutorProfile', tutorProfileSchema);
