const role = (...allowed) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'You are not allowed to do this' });
  }

  return next();
};

module.exports = role;
