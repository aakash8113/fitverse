// Cloudinary Configuration
// Centralised setup so all modules share one configured instance

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const config = require('./env');

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key:    config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Create a Cloudinary multer storage for a given folder.
 * Uploaded files come back with file.path = full https:// URL
 * and file.filename = public_id (used for deletion).
 */
const makeStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });

module.exports = { cloudinary, makeStorage };
