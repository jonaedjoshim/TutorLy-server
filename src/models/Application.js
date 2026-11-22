const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TuitionPost',
      required: true,
    },
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ post: 1, tutor: 1 }, { unique: true });
applicationSchema.index({ tutor: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
