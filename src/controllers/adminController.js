const User = require('../models/User');
const TuitionPost = require('../models/TuitionPost');
const TutorProfile = require('../models/TutorProfile');
const Application = require('../models/Application');
const { parsePagination, paginated } = require('../utils/pagination');

exports.getStats = async (req, res, next) => {
  try {
    const [users, posts, pendingPosts, tutors, unverifiedTutors, applications] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      TuitionPost.countDocuments(),
      TuitionPost.countDocuments({ status: 'pending' }),
      TutorProfile.countDocuments(),
      TutorProfile.countDocuments({ verified: false }),
      Application.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      stats: { users, posts, pendingPosts, tutors, unverifiedTutors, applications },
    });
  } catch (error) {
    return next(error);
  }
};

exports.listPendingPosts = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { status: 'pending' };

    const [posts, total] = await Promise.all([
      TuitionPost.find(filter)
        .populate('student', 'name email location')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      TuitionPost.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, ...paginated(posts, total, page, limit) });
  } catch (error) {
    return next(error);
  }
};

exports.reviewPost = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const post = await TuitionPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Tuition post not found' });
    }

    post.status = status;
    await post.save();

    return res.status(200).json({ success: true, post });
  } catch (error) {
    return next(error);
  }
};

exports.listTutors = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {};

    const [tutors, total] = await Promise.all([
      TutorProfile.find(filter)
        .populate('user', 'name email location')
        .sort({ verified: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TutorProfile.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, ...paginated(tutors, total, page, limit) });
  } catch (error) {
    return next(error);
  }
};

exports.setTutorVerification = async (req, res, next) => {
  try {
    const { verified } = req.body;

    if (typeof verified !== 'boolean') {
      return res.status(400).json({ success: false, message: 'verified must be true or false' });
    }

    const profile = await TutorProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Tutor profile not found' });
    }

    profile.verified = verified;
    await profile.save();

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    return next(error);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [users, total] = await Promise.all([
      User.find({ role: { $ne: 'admin' } })
        .select('name email role location status createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: { $ne: 'admin' } }),
    ]);

    return res.status(200).json({ success: true, ...paginated(users, total, page, limit) });
  } catch (error) {
    return next(error);
  }
};

exports.setUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active or suspended' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be suspended' });
    }

    user.status = status;
    await user.save();

    return res.status(200).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (error) {
    return next(error);
  }
};
