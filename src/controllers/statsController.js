const TutorProfile = require('../models/TutorProfile');
const TuitionPost = require('../models/TuitionPost');
const Review = require('../models/Review');

exports.publicStats = async (req, res, next) => {
  try {
    const [tutors, areas, posts, ratings] = await Promise.all([
      TutorProfile.countDocuments({ verified: true }),
      TutorProfile.distinct('area', { verified: true }),
      TuitionPost.countDocuments({ status: 'approved' }),
      Review.aggregate([
        { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    const rating = ratings[0];

    return res.status(200).json({
      success: true,
      stats: {
        tutors,
        areas: areas.filter(Boolean).length,
        posts,
        rating: rating?.count ? Number(rating.average.toFixed(1)) : null,
        reviewCount: rating?.count || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};
