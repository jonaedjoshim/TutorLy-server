const router = require('express').Router();
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const role = require('../middleware/role');
const validate = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const tutorController = require('../controllers/tutorController');
const documentController = require('../controllers/documentController');

router.get('/', tutorController.listTutors);
router.get('/me', auth, role('tutor'), tutorController.getMyProfile);

router.put(
  '/me',
  auth,
  role('tutor'),
  [
    body('subjects').optional().isArray().withMessage('Subjects must be a list'),
    body('classLevels').optional().isArray().withMessage('Class levels must be a list'),
    body('experience').optional().isNumeric().withMessage('Experience must be a number'),
    body('hourlyRate').optional().isNumeric().withMessage('Rate must be a number'),
    body('online').optional().isBoolean().withMessage('Online must be true or false'),
  ],
  validate,
  tutorController.updateMyProfile
);

router.post(
  '/me/documents',
  auth,
  role('tutor'),
  upload.array('documents', 5),
  documentController.uploadDocuments
);

router.get('/me/documents/:filename', auth, documentController.downloadDocument);

router.delete(
  '/me/documents/:filename',
  auth,
  role('tutor'),
  documentController.removeDocument
);

router.get('/:id', tutorController.getTutor);

module.exports = router;
