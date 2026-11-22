const router = require('express').Router();

const statsController = require('../controllers/statsController');

router.get('/', statsController.publicStats);

module.exports = router;
