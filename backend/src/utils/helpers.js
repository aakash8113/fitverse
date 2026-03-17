// Helper Utilities
// Common utility functions used across the application

const crypto = require('crypto');

/**
 * Generate random 6-digit OTP
 * @returns {String} 6-digit OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Generate OTP expiry time
 * @param {Number} minutes - Minutes from now
 * @returns {Date} Expiry date
 */
const generateOTPExpiry = (minutes = 5) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Check if OTP is expired
 * @param {Date} expiryDate - OTP expiry date
 * @returns {Boolean}
 */
const isOTPExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

/**
 * Generate unique order number
 * Format: FV + YYYYMMDD + Random5Digits
 * @returns {String} Order number
 */
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = crypto.randomInt(10000, 99999);
  
  return `FV${year}${month}${day}${random}`;
};

/**
 * Remove sensitive fields from user object
 * @param {Object} user - User object
 * @returns {Object} Sanitized user object
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  
  const { password, emailOTP, phoneOTP, otpExpiresAt, ...sanitized } = user;
  return sanitized;
};

/**
 * Calculate pagination offset
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @returns {Number} Offset
 */
const calculateOffset = (page, limit) => {
  return (page - 1) * limit;
};

/**
 * Parse pagination parameters from query
 * @param {Object} query - Express req.query
 * @returns {Object} {page, limit, skip}
 */
const parsePagination = (query) => {
  const pageRaw = parseInt(query.page, 10) || 1;
  const limitRaw = parseInt(query.limit, 10) || 10;
  const page = Math.max(1, pageRaw);
  const limit = Math.min(100, Math.max(1, limitRaw));
  const skip = calculateOffset(page, limit);
  
  return { page, limit, skip };
};

module.exports = {
  generateOTP,
  generateOTPExpiry,
  isOTPExpired,
  generateOrderNumber,
  sanitizeUser,
  calculateOffset,
  parsePagination,
};
