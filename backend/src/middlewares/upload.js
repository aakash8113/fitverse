// File Upload Middleware — Cloudinary (or local disk fallback)
// When Cloudinary is configured: req.files[n].path = full https:// URL
// When using disk fallback:       req.files[n].path = /uploads/<folder>/<filename>

const path = require('path');
const multer = require('multer');
const { makeStorage } = require('../config/cloudinary');
const { BadRequestError } = require('../utils/errors');
const config = require('../config/env');

// Normalize file paths for disk storage to be public URL paths.
// Cloudinary storage already sets file.path to the https URL, so it's a no-op there.
const normalizePaths = (req, _res, next) => {
  const normalize = (file) => {
    // If it looks like a file system path (not http), convert it to a URL
    if (file && file.path && !file.path.startsWith('http')) {
      // Convert absolute disk path to a relative /uploads/... URL
      const rel = file.path.replace(/\\/g, '/');
      const idx = rel.indexOf('/uploads/');
      file.path = idx !== -1 ? rel.slice(idx) : `/${rel}`;
    }
  };
  if (req.file) normalize(req.file);
  if (req.files) {
    if (Array.isArray(req.files)) req.files.forEach(normalize);
    else Object.values(req.files).flat().forEach(normalize);
  }
  next();
};

// File filter — only images allowed
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  if (allowed.test(file.mimetype) && allowed.test(file.originalname.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
  }
};

// Wrap a multer instance so every method automatically normalizes file paths.
const wrap = (multerInstance) => {
  const original = {
    any: multerInstance.any.bind(multerInstance),
    array: multerInstance.array.bind(multerInstance),
    single: multerInstance.single.bind(multerInstance),
    fields: multerInstance.fields.bind(multerInstance),
    none: multerInstance.none.bind(multerInstance),
  };

  const chain = (middleware) => (req, res, next) =>
    middleware(req, res, (err) => {
      if (err) return next(err);
      normalizePaths(req, res, next);
    });

  return {
    any:    (...args) => chain(original.any(...args)),
    array:  (...args) => chain(original.array(...args)),
    single: (...args) => chain(original.single(...args)),
    fields: (...args) => chain(original.fields(...args)),
    none:   (...args) => chain(original.none(...args)),
  };
};

// Route-specific uploaders — files land in the correct Cloudinary folder (or local subfolder)
const uploadProduct = wrap(multer({
  storage: makeStorage('fitverse/products'),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter,
}));

const uploadThrift = wrap(multer({
  storage: makeStorage('fitverse/thrift'),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter,
}));

const uploadAvatar = wrap(multer({
  storage: makeStorage('fitverse/avatars'),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter,
}));

// Default upload (generic folder)
const upload = wrap(multer({
  storage: makeStorage('fitverse/uploads'),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter,
}));

// Attach named uploaders
upload.product = uploadProduct;
upload.thrift  = uploadThrift;
upload.avatar  = uploadAvatar;

module.exports = upload;
