const mongoose = require('mongoose');

const tuitionPostSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    classLevel: {
      type: String,
      required: [true, 'Class level is required'],
      trim: true,
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: 0,
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
    },
    medium: {
      type: String,
      enum: ['Bangla', 'English', 'English Version', 'Madrasa'],
      default: 'Bangla',
    },
    daysPerWeek: {
      type: Number,
      default: 2,
      min: 1,
      max: 7,
    },
    preferredDays: {
      type: [String],
      default: [],
    },
    tutorGender: {
      type: String,
      enum: ['any', 'male', 'female'],
      default: 'any',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

tuitionPostSchema.index({ status: 1, subject: 1, area: 1 });
tuitionPostSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('TuitionPost', tuitionPostSchema);
