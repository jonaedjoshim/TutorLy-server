const mongoose = require('mongoose');

const Review = require('../models/Review');
const Application = require('../models/Application');
const TuitionPost = require('../models/TuitionPost');
const TutorProfile = require('../models/TutorProfile');
const { parsePagination, paginated } = require('../utils/pagination');

exports.createReview = async (req, res, next) => {
  try {
    const { tutorId, rating, comment } = req.body;

    const posts = await TuitionPost.find({ student: req.user._id }).select('_id');
    const postIds = posts.map((post) => post._id);

    const accepted = await Application.exists({
      post: { $in: postIds },
      tutor: tutorId,
      status: 'accepted',
    });

    if (!accepted) {
      return res.status(403).json({
        success: false,
        message: 'You can only review a tutor after an accepted application',
      });
    }

    const review = await Review.create({
      tutor: tutorId,
      student: req.user._id,
      rating: Number(rating),
      comment: comment || '',
    });

    await refreshTutorRating(tutorId);

    return res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this tutor' });
    }
    return next(error);
  }
};

exports.listReviews = async (req, res, next) => {
  try {
    const { tutorId } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    if (!tutorId) {
      return res.status(400).json({ success: false, message: 'tutorId is required' });
    }

    const filter = { tutor: tutorId };
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('student', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, ...paginated(reviews, total, page, limit) });
  } catch (error) {
    return next(error);
  }
};

const refreshTutorRating = async (tutorId) => {
  const [stats] = await Review.aggregate([
    { $match: { tutor: new mongoose.Types.ObjectId(tutorId) } },
    { $group: { _id: '$tutor', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await TutorProfile.updateOne(
    { user: tutorId },
    {
      $set: {
        ratingAvg: stats ? Math.round(stats.avg * 10) / 10 : 0,
        ratingCount: stats ? stats.count : 0,
      },
    }
  );
};
