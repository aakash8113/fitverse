// Image Storage Service — Cloudinary
// upload() returns the full https:// URL to store in DB
// delete() destroys the asset on Cloudinary by its public_id

const { cloudinary } = require('../config/cloudinary');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');

class ImageService {
  /**
   * "Upload" a file that multer-storage-cloudinary already pushed to Cloudinary.
   * file.path     = full Cloudinary https:// URL
   * file.filename = public_id (used for deletion)
   * @param {Object} file - Multer file object from CloudinaryStorage
   * @returns {Promise<String>} Full Cloudinary URL
   */
  async upload(file) {
    try {
      if (!file) throw new Error('No file provided');
      const url = file.path; // Already uploaded by multer-storage-cloudinary
      logger.info(`Image on Cloudinary: ${url}`);
      return url;
    } catch (error) {
      logger.error(`imageService.upload failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload multiple files.
   * @param {Object[]} files - Multer file objects
   * @returns {Promise<String[]>} Array of Cloudinary URLs
   */
  async uploadMultiple(files) {
    try {
      return await Promise.all(files.map((f) => this.upload(f)));
    } catch (error) {
      logger.error(`imageService.uploadMultiple failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete an image from Cloudinary.
   * Accepts either a full Cloudinary URL or a public_id.
   * @param {String} urlOrPublicId
   * @returns {Promise<Boolean>}
   */
  async delete(urlOrPublicId) {
    try {
      if (!urlOrPublicId) return false;

      // Local file path cleanup fallback (for non-Cloudinary storage)
      if (!String(urlOrPublicId).startsWith('http')) {
        const normalized = String(urlOrPublicId).replace(/\\/g, '/').replace(/^\/+/, '');
        if (normalized.startsWith('uploads/')) {
          const localPath = path.resolve(__dirname, '../../', normalized);
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
            logger.info(`Local image deleted: ${localPath}`);
            return true;
          }
          return false;
        }
      }

      if (!cloudinary) {
        return false;
      }

      let publicId = urlOrPublicId;

      // Extract public_id from a Cloudinary URL
      // e.g. https://res.cloudinary.com/dw1mjqbbj/image/upload/v123/fitverse/products/abc.webp
      //   -> fitverse/products/abc
      if (urlOrPublicId.startsWith('http')) {
        const cleanUrl = String(urlOrPublicId).split('?')[0];
        const match = cleanUrl.match(/\/upload\/(?:v\d+\/)?(.*?)(?:\.[a-zA-Z0-9]+)?$/);
        publicId = match ? match[1] : urlOrPublicId;
      }

      const result = await cloudinary.uploader.destroy(publicId);
      logger.info(`Cloudinary delete ${publicId}: ${result.result}`);
      return result.result === 'ok';
    } catch (error) {
      logger.error(`imageService.delete failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete multiple images.
   * @param {String[]} urlsOrIds
   */
  async deleteMultiple(urlsOrIds) {
    return Promise.all((urlsOrIds || []).map((u) => this.delete(u).catch(() => false)));
  }

  /**
   * Pass-through — URLs stored in DB are already full Cloudinary https:// URLs.
   * @param {String} url
   * @returns {String|null}
   */
  getImageUrl(url) {
    return url || null;
  }
}

module.exports = new ImageService();
