// File Upload Middleware
// Handles image uploads using Multer with memory storage

const multer = require('multer');
const path = require('path');
const { BadRequestError } = require('../utils/errors');
const config = require('../config/env');

// Memory storage (files stored in memory as Buffer objects)
// Better for cloud uploads where we'll stream directly to S3/Cloudinary
const storage = multer.memoryStorage();

// File filter - only images allowed
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new BadRequestError('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize, // 5MB default
  },
  fileFilter: fileFilter,
});

module.exports = upload;
