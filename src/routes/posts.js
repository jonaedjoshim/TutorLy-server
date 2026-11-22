const router = require('express').Router();
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const role = require('../middleware/role');
const validate = require('../middleware/validate');
const postController = require('../controllers/postController');

const postRules = [
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('classLevel').trim().notEmpty().withMessage('Class level is required'),
  body('budget').isNumeric().withMessage('Budget must be a number'),
  body('area').trim().notEmpty().withMessage('Area is required'),
  body('daysPerWeek').optional().isInt({ min: 1, max: 7 }),
];

router.get('/', postController.listPosts);
router.post('/', auth, role('student'), postRules, validate, postController.createPost);
router.get('/mine', auth, role('student'), postController.myPosts);
router.get('/:id', postController.getPost);
router.put('/:id', auth, role('student'), postRules, validate, postController.updatePost);
router.delete('/:id', auth, role('student'), postController.deletePost);

module.exports = router;
