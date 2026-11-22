const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  console.error('[error]', err.stack || err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || { record: 1 })[0];
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((item) => item.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}` });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong',
  });
};

module.exports = { notFound, errorHandler };
