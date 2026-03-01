// Cloudinary Configuration
// Centralised setup so all modules share one configured instance
// Falls back to local disk storage when Cloudinary credentials are not set.

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const config = require('./env');

const hasCloudinary = !!(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret);

let cloudinary = null;
let CloudinaryStorage = null;

if (hasCloudinary) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key:    config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  ({ CloudinaryStorage } = require('multer-storage-cloudinary'));
  console.log('☁️  Cloudinary storage enabled');
} else {
  console.log('⚠️  Cloudinary credentials not set — falling back to local disk storage (uploads/)');
}

/**
 * Create a storage engine for a given folder.
 * Uses Cloudinary when credentials are present, local disk otherwise.
 * When using disk storage, file.path is set to the public URL path so
 * downstream code (which reads file.path) works identically.
 */
const makeStorage = (folder) => {
  if (hasCloudinary) {
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
    });
  }

  // Local disk fallback — store in uploads/<subfolder>/
  const subfolder = folder.split('/').pop(); // e.g. "thrift" from "fitverse/thrift"
  const uploadDir = path.resolve(__dirname, '../../uploads', subfolder);
  fs.mkdirSync(uploadDir, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${unique}${ext}`);
    },
  });
};

// Patch multer so file.path is always set (diskStorage sets file.path natively;
// Cloudinary storage sets file.path to the https URL — both work as-is).
module.exports = { cloudinary, makeStorage };
