const router = require('express').Router();
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const role = require('../middleware/role');
const validate = require('../middleware/validate');
const applicationController = require('../controllers/applicationController');

router.post(
  '/',
  auth,
  role('tutor'),
  [
    body('postId').notEmpty().withMessage('postId is required'),
    body('message').optional().isString(),
  ],
  validate,
  applicationController.applyToPost
);

router.get('/mine', auth, role('tutor'), applicationController.myApplications);
router.get('/received', auth, role('student'), applicationController.receivedApplications);

router.put(
  '/:id',
  auth,
  role('student'),
  [body('status').isIn(['accepted', 'rejected']).withMessage('Invalid status')],
  validate,
  applicationController.updateStatus
);

module.exports = router;
