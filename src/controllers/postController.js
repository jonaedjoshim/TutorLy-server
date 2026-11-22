const TuitionPost = require('../models/TuitionPost');
const Application = require('../models/Application');
const { parsePagination, paginated } = require('../utils/pagination');
const escapeRegex = require('../utils/escapeRegex');

exports.createPost = async (req, res, next) => {
  try {
    const fields = [
      'subject',
      'classLevel',
      'budget',
      'area',
      'medium',
      'daysPerWeek',
      'preferredDays',
      'tutorGender',
      'description',
    ];
    const payload = { student: req.user._id, status: 'pending' };

    fields.forEach((field) => {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    });

    const post = await TuitionPost.create(payload);
    return res.status(201).json({ success: true, post });
  } catch (error) {
    return next(error);
  }
};

exports.listPosts = async (req, res, next) => {
  try {
    const { subject, area, classLevel, minBudget, maxBudget } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = { status: 'approved' };
    if (subject) filter.subject = new RegExp(escapeRegex(subject), 'i');
    if (area) filter.area = new RegExp(escapeRegex(area), 'i');
    if (classLevel) filter.classLevel = new RegExp(escapeRegex(classLevel), 'i');

    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = Number(minBudget);
      if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }

    const [posts, total] = await Promise.all([
      TuitionPost.find(filter)
        .populate('student', 'name location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TuitionPost.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, ...paginated(posts, total, page, limit) });
  } catch (error) {
    return next(error);
  }
};

exports.myPosts = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { student: req.user._id };

    const [posts, total] = await Promise.all([
      TuitionPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      TuitionPost.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, ...paginated(posts, total, page, limit) });
  } catch (error) {
    return next(error);
  }
};

exports.getPost = async (req, res, next) => {
  try {
    const post = await TuitionPost.findById(req.params.id).populate('student', 'name location createdAt');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Tuition post not found' });
    }

    return res.status(200).json({ success: true, post });
  } catch (error) {
    return next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const post = await TuitionPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Tuition post not found' });
    }

    if (post.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own posts' });
    }

    const fields = [
      'subject',
      'classLevel',
      'budget',
      'area',
      'medium',
      'daysPerWeek',
      'preferredDays',
      'tutorGender',
      'description',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) post[field] = req.body[field];
    });
    post.status = 'pending';

    await post.save();
    return res.status(200).json({ success: true, post });
  } catch (error) {
    return next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await TuitionPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Tuition post not found' });
    }

    if (post.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own posts' });
    }

    await Application.deleteMany({ post: post._id });
    await post.deleteOne();

    return res.status(200).json({ success: true, message: 'Tuition post removed' });
  } catch (error) {
    return next(error);
  }
};
