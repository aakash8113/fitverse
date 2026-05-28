// Fitverse AI Routes

const express = require('express');
const multer = require('multer');
const fitverseAiController = require('../controllers/fitverseAiController');
const { protect } = require('../middlewares/auth');
const config = require('../config/env');
const { BadRequestError } = require('../utils/errors');

const router = express.Router();

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
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter,
});

router.post('/model/check', protect, upload.single('input_image'), fitverseAiController.checkModel);
router.post('/models', protect, upload.single('model_image'), fitverseAiController.createModel);
router.get('/models', protect, fitverseAiController.listModels);
router.delete('/models/:id', protect, fitverseAiController.deleteModel);
router.post('/clothes/check', protect, upload.single('input_image'), fitverseAiController.checkClothes);
router.post(
  '/tryon',
  protect,
  upload.fields([
    { name: 'model_image', maxCount: 1 },
    { name: 'cloth_image', maxCount: 1 },
    { name: 'lower_cloth_image', maxCount: 1 },
  ]),
  fitverseAiController.createTryOn
);
router.get('/tryon/:id/result', protect, fitverseAiController.getTryOnResult);
router.get('/tryon/:id', protect, fitverseAiController.getTryOnStatus);

module.exports = router;
