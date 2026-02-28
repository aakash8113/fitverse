// Global Error Handling Middleware
// Catches all errors and formats them consistently

const logger = require('../config/logger');
const ApiResponse = require('../utils/apiResponse');

/**
 * Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Log error
  if (statusCode === 500) {
    logger.error(`${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
      error: err.stack,
    });
  } else {
    logger.warn(`${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  }

  // Prisma errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        const field = err.meta?.target?.[0] || 'field';
        statusCode = 409;
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        break;
      case 'P2025':
        // Record not found
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        // Foreign key constraint failed
        statusCode = 400;
        message = 'Invalid reference';
        break;
      default:
        statusCode = 500;
        message = 'Database error';
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation errors from Multer (file upload)
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Too many files uploaded';
    }
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  // Send error response
  return ApiResponse.error(res, statusCode, message, errors);
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  const message = `Route not found: ${req.originalUrl}`;
  logger.warn(message);
  return ApiResponse.error(res, 404, message);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
