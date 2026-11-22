const TutorProfile = require('../models/TutorProfile');
const { parsePagination, paginated } = require('../utils/pagination');
const escapeRegex = require('../utils/escapeRegex');

const publicFields = 'name location createdAt';

exports.listTutors = async (req, res, next) => {
  try {
    const { subject, area, classLevel, minRate, maxRate, online, verified, sort } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = {};

    if (subject) filter.subjects = { $in: [new RegExp(escapeRegex(subject), 'i')] };
    if (area) filter.area = new RegExp(escapeRegex(area), 'i');
    if (classLevel) filter.classLevels = { $in: [new RegExp(escapeRegex(classLevel), 'i')] };
    if (online !== undefined) filter.online = online === 'true';
    if (verified !== undefined) filter.verified = verified === 'true';

    if (minRate || maxRate) {
      filter.hourlyRate = {};
      if (minRate) filter.hourlyRate.$gte = Number(minRate);
      if (maxRate) filter.hourlyRate.$lte = Number(maxRate);
    }

    const sortOptions = {
      rate_asc: { hourlyRate: 1 },
      rate_desc: { hourlyRate: -1 },
      experience: { experience: -1 },
      rating: { ratingAvg: -1, ratingCount: -1 },
      newest: { createdAt: -1 },
    };

    const [tutors, total] = await Promise.all([
      TutorProfile.find(filter)
        .populate('user', publicFields)
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(limit),
      TutorProfile.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, ...paginated(tutors, total, page, limit) });
  } catch (error) {
    return next(error);
  }
};

exports.getTutor = async (req, res, next) => {
  try {
    const { id } = req.params;

    let profile = await TutorProfile.findById(id).populate('user', publicFields);
    if (!profile) {
      profile = await TutorProfile.findOne({ user: id }).populate('user', publicFields);
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Tutor profile not found' });
    }

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    return next(error);
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    let profile = await TutorProfile.findOne({ user: req.user._id }).populate('user', publicFields);

    if (!profile) {
      profile = await TutorProfile.create({ user: req.user._id });
      await profile.populate('user', publicFields);
    }

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    return next(error);
  }
};

exports.updateMyProfile = async (req, res, next) => {
  try {
    const allowed = [
      'headline',
      'qualification',
      'experience',
      'subjects',
      'classLevels',
      'area',
      'hourlyRate',
      'online',
      'bio',
    ];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const profile = await TutorProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('user', publicFields);

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    return next(error);
  }
};
