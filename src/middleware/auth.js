const User = require('../models/User');
const { verifyToken } = require('../utils/token');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Account no longer exists' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'This account is suspended' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = auth;
