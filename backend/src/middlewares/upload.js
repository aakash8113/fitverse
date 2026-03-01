// File Upload Middleware — Cloudinary
// Files are streamed directly to Cloudinary; req.files[n].path = full https:// URL

const multer = require('multer');
const { makeStorage } = require('../config/cloudinary');
const { BadRequestError } = require('../utils/errors');
const config = require('../config/env');

// File filter — only images allowed
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  if (allowed.test(file.mimetype) && allowed.test(file.originalname.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
  }
};

// Route-specific uploaders — files land in the correct Cloudinary folder
const uploadProduct = multer({
  storage: makeStorage('fitverse/products'),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter,
});

const uploadThrift = multer({
  storage: makeStorage('fitverse/thrift'),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter,
});

const uploadAvatar = multer({
  storage: makeStorage('fitverse/avatars'),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter,
});

// Default upload (generic folder) — used by routes that don't specify a folder
const upload = multer({
  storage: makeStorage('fitverse/uploads'),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter,
});

// Attach named uploaders so routes can use upload.product / upload.thrift / etc.
upload.product = uploadProduct;
upload.thrift  = uploadThrift;
upload.avatar  = uploadAvatar;

module.exports = upload;

