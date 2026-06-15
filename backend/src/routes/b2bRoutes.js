// B2B API Routes (v1)
// Public API for business clients — authenticated via x-api-key

const express = require('express');
const router = express.Router();
const multer = require('multer');
const config = require('../config/env');
const b2bController = require('../controllers/b2bController');
const { authenticateBusinessApiKey } = require('../middlewares/businessAuth');
const { BadRequestError } = require('../utils/errors');

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  if (allowed.test(file.mimetype) && allowed.test(file.originalname.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload?.maxFileSize || 10 * 1024 * 1024 },
  fileFilter,
});

// All B2B routes require API key authentication
router.use(authenticateBusinessApiKey);

// Try-on
router.post('/tryon', upload.fields([
  { name: 'model_image', maxCount: 1 },
  { name: 'cloth_image', maxCount: 1 },
  { name: 'lower_cloth_image', maxCount: 1 },
]), b2bController.createTryOn);

router.get('/tryon/:id', b2bController.getTryOnStatus);

// Image checks
router.post('/model/check', upload.single('input_image'), b2bController.checkModel);
router.post('/clothes/check', upload.single('input_image'), b2bController.checkClothes);

// Credits & usage
router.get('/credits', b2bController.getCredits);
router.get('/usage', b2bController.getUsage);

// API key management
router.get('/keys', b2bController.getApiKeys);
router.post('/keys', b2bController.createApiKey);
router.delete('/keys/:id', b2bController.revokeApiKey);

module.exports = router;