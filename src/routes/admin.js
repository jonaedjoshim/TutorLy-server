const router = require('express').Router();
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const role = require('../middleware/role');
const validate = require('../middleware/validate');
const adminController = require('../controllers/adminController');

router.use(auth, role('admin'));

router.get('/stats', adminController.getStats);

router.get('/posts/pending', adminController.listPendingPosts);
router.put(
  '/posts/:id',
  [body('status').isIn(['approved', 'rejected']).withMessage('Invalid status')],
  validate,
  adminController.reviewPost
);

router.get('/tutors', adminController.listTutors);
router.put(
  '/tutors/:id/verify',
  [body('verified').isBoolean().withMessage('verified must be a boolean')],
  validate,
  adminController.setTutorVerification
);

router.get('/users', adminController.listUsers);
router.put(
  '/users/:id/status',
  [body('status').isIn(['active', 'suspended']).withMessage('Invalid status')],
  validate,
  adminController.setUserStatus
);

module.exports = router;
