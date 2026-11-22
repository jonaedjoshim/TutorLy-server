const router = require('express').Router();
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const authController = require('../controllers/authController');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['student', 'tutor']).withMessage('Invalid account type'),
    body('phone').optional().isString(),
    body('location').optional().isString(),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
);

router.get('/me', auth, authController.me);

router.put(
  '/profile',
  auth,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().isString(),
    body('location').optional().isString(),
    body('bio').optional().isString(),
  ],
  validate,
  authController.updateProfile
);

module.exports = router;
