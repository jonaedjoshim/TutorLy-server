const router = require('express').Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'tutorly-api',
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
