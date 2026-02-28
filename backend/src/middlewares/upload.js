// File Upload Middleware
// Handles image uploads using Multer with disk storage

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { BadRequestError } = require('../utils/errors');
const config = require('../config/env');

// Ensure uploads directories exist
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const THRIFT_DIR  = path.join(UPLOADS_DIR, 'thrift');
const PRODUCTS_DIR = path.join(UPLOADS_DIR, 'products');
[UPLOADS_DIR, THRIFT_DIR, PRODUCTS_DIR].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Disk storage — saves files to /uploads/<subfolder>/
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Use thrift subfolder for thrift routes, products otherwise
    const isThrift = req.baseUrl?.includes('thrift') || req.path?.includes('thrift');
    cb(null, isThrift ? THRIFT_DIR : PRODUCTS_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

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
