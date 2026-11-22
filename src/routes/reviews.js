const router = require('express').Router();
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const role = require('../middleware/role');
const validate = require('../middleware/validate');
const reviewController = require('../controllers/reviewController');

router.get('/', reviewController.listReviews);

router.post(
  '/',
  auth,
  role('student'),
  [
    body('tutorId').notEmpty().withMessage('tutorId is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().trim().isLength({ max: 500 }),
  ],
  validate,
  reviewController.createReview
);

module.exports = router;
