const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/token');

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  location: user.location,
  bio: user.bio,
  status: user.status,
  createdAt: user.createdAt,
});

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, location } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role === 'tutor' ? 'tutor' : 'student',
      phone: phone || '',
      location: location || '',
    });

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      token,
      user: safeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect' });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'This account is suspended' });
    }

    return res.status(200).json({
      success: true,
      token: signToken(user),
      user: safeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

exports.me = async (req, res) =>
  res.status(200).json({ success: true, user: safeUser(req.user) });

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'location', 'bio'];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({ success: true, user: safeUser(user) });
  } catch (error) {
    return next(error);
  }
};
