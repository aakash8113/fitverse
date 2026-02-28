// Image Storage Service Abstraction
// Currently uses local file system, ready for cloud storage integration

const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');
const config = require('../config/env');

class ImageService {
  constructor() {
    this.uploadDir = path.resolve(config.upload.uploadPath);
  }

  /**
   * Upload Image
   * @param {Object} file - Multer file object
   * @param {String} subfolder - Subfolder within uploads (e.g., 'products', 'avatars')
   * @returns {Promise<String>} File path relative to uploads folder
   */
  async upload(file, subfolder = 'products') {
    try {
      // ============================================
      // 🚀 PRODUCTION UPGRADE POINT: Cloud Storage
      // ============================================
      // Replace local storage with cloud service
      // Options: AWS S3, Cloudinary, Azure Blob Storage, Google Cloud Storage
      //
      // Example AWS S3 implementation:
      // const AWS = require('aws-sdk');
      // const s3 = new AWS.S3({
      //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      //   region: process.env.AWS_REGION,
      // });
      // const key = `${subfolder}/${Date.now()}-${file.originalname}`;
      // await s3.upload({
      //   Bucket: process.env.AWS_BUCKET_NAME,
      //   Key: key,
      //   Body: file.buffer,
      //   ContentType: file.mimetype,
      //   ACL: 'public-read',
      // }).promise();
      // return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
      //
      // Example Cloudinary implementation:
      // const cloudinary = require('cloudinary').v2;
      // cloudinary.config({
      //   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      //   api_key: process.env.CLOUDINARY_API_KEY,
      //   api_secret: process.env.CLOUDINARY_API_SECRET,
      // });
      // const result = await cloudinary.uploader.upload(file.path, {
      //   folder: subfolder,
      //   use_filename: true,
      // });
      // return result.secure_url;
      // ============================================

      // Local file system storage
      const subfolderPath = path.join(this.uploadDir, subfolder);
      
      // Create subfolder if it doesn't exist
      await fs.mkdir(subfolderPath, { recursive: true });

      // ── Disk storage: file already saved by multer, just compute relative path ──
      if (file.path) {
        const normalized = file.path.replace(/\\/g, '/');
        const idx = normalized.indexOf('uploads/');
        const relativePath = idx !== -1 ? normalized.slice(idx) : `uploads/${subfolder}/${file.filename}`;
        logger.info(`Image stored (disk): ${relativePath}`);
        return relativePath;
      }

      // ── Memory storage: write buffer manually ──
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const ext = path.extname(file.originalname);
      const filename = `${timestamp}-${randomString}${ext}`;
      const filepath = path.join(subfolderPath, filename);

      // Save file
      await fs.writeFile(filepath, file.buffer);

      // Return relative path (stored in database)
      const relativePath = `uploads/${subfolder}/${filename}`;
      
      logger.info(`Image uploaded: ${relativePath}`);
      return relativePath;
    } catch (error) {
      logger.error(`Failed to upload image: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload Multiple Images
   * @param {Array} files - Array of Multer file objects
   * @param {String} subfolder - Subfolder within uploads
   * @returns {Promise<Array>} Array of file paths
   */
  async uploadMultiple(files, subfolder = 'products') {
    try {
      const uploadPromises = files.map(file => this.upload(file, subfolder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      logger.error(`Failed to upload multiple images: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete Image
   * @param {String} filepath - Relative path to file (e.g., 'uploads/products/image.jpg')
   * @returns {Promise<Boolean>}
   */
  async delete(filepath) {
    try {
      // ============================================
      // 🚀 PRODUCTION UPGRADE POINT: Cloud Storage Delete
      // ============================================
      // Replace local deletion with cloud service
      //
      // Example AWS S3 implementation:
      // const AWS = require('aws-sdk');
      // const s3 = new AWS.S3({...});
      // const key = filepath.replace(`https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/`, '');
      // await s3.deleteObject({
      //   Bucket: process.env.AWS_BUCKET_NAME,
      //   Key: key,
      // }).promise();
      //
      // Example Cloudinary implementation:
      // const cloudinary = require('cloudinary').v2;
      // cloudinary.config({...});
      // const publicId = filepath.split('/').pop().split('.')[0];
      // await cloudinary.uploader.destroy(publicId);
      // ============================================

      // Local file system deletion
      const fullPath = path.resolve(filepath);
      
      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch {
        logger.warn(`File not found for deletion: ${filepath}`);
        return false;
      }

      await fs.unlink(fullPath);
      logger.info(`Image deleted: ${filepath}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete image: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete Multiple Images
   * @param {Array} filepaths - Array of file paths
   * @returns {Promise<Array>} Array of deletion results
   */
  async deleteMultiple(filepaths) {
    try {
      const deletePromises = filepaths.map(filepath => 
        this.delete(filepath).catch(() => false)
      );
      return await Promise.all(deletePromises);
    } catch (error) {
      logger.error(`Failed to delete multiple images: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Image URL
   * In production, this would return full cloud URL
   * @param {String} filepath - Relative file path
   * @returns {String} Full URL or path
   */
  getImageUrl(filepath) {
    // ============================================
    // 🚀 PRODUCTION UPGRADE POINT: URL Generation
    // ============================================
    // In production with cloud storage, return full URL
    // For local storage, return path that frontend can access
    // ============================================

    if (!filepath) return null;
    
    // For local development, return the relative path
    // Frontend should prepend API base URL
    return filepath;
  }
}

module.exports = new ImageService();
