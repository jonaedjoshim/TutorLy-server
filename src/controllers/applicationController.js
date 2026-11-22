const Application = require('../models/Application');
const TuitionPost = require('../models/TuitionPost');
const { parsePagination, paginated } = require('../utils/pagination');

exports.applyToPost = async (req, res, next) => {
  try {
    const { postId, message } = req.body;

    const post = await TuitionPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Tuition post not found' });
    }

    if (post.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'This request is not open for applications' });
    }

    const application = await Application.create({
      post: post._id,
      tutor: req.user._id,
      message: message || '',
    });

    return res.status(201).json({ success: true, application });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already applied to this request' });
    }
    return next(error);
  }
};

exports.myApplications = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { tutor: req.user._id };

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate({ path: 'post', select: 'subject classLevel area budget status' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Application.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, ...paginated(applications, total, page, limit) });
  } catch (error) {
    return next(error);
  }
};

exports.receivedApplications = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const myPosts = await TuitionPost.find({ student: req.user._id }).select('_id');
    const postIds = myPosts.map((post) => post._id);
    const filter = { post: { $in: postIds } };

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('tutor', 'name location')
        .populate('post', 'subject classLevel area budget')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Application.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, ...paginated(applications, total, page, limit) });
  } catch (error) {
    return next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be accepted or rejected' });
    }

    const application = await Application.findById(req.params.id)
      .populate('post')
      .populate('tutor', 'name location');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.post.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only manage applications on your own posts' });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({ success: true, application });
  } catch (error) {
    return next(error);
  }
};
