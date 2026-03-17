// Global Error Handling Middleware
// Catches all errors and formats them consistently

const logger = require('../config/logger');
const ApiResponse = require('../utils/apiResponse');
const { isSchemaMismatchError, isTransientDbError } = require('../utils/dbErrors');

/**
 * Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;
  let code = err.code || null;
  const requestId = req.requestId || req.headers['x-request-id'] || null;

  // Log error
  if (statusCode === 500) {
    logger.error(`${message} - ${req.originalUrl} - ${req.method} - ${req.ip} - reqId=${requestId || 'n/a'}`, {
      error: err.stack,
    });
  } else {
    logger.warn(`${message} - ${req.originalUrl} - ${req.method} - ${req.ip} - reqId=${requestId || 'n/a'}`);
  }

  // Prisma errors
  if (err.code) {
    switch (err.code) {
      case 'P2021':
      case 'P2022':
        // Table or column does not exist -> schema drift between code and DB.
        statusCode = 503;
        message = 'Database schema is updating. Please retry in a few seconds';
        code = 'DB_SCHEMA_MISMATCH';
        break;
      case 'P2002':
        // Unique constraint violation
        const field = err.meta?.target?.[0] || 'field';
        statusCode = 409;
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        code = 'P2002';
        break;
      case 'P2025':
        // Record not found
        statusCode = 404;
        message = 'Record not found';
        code = 'P2025';
        break;
      case 'P2003':
        // Foreign key constraint failed
        statusCode = 400;
        message = 'Invalid reference';
        code = 'P2003';
        break;
      default:
        statusCode = 500;
        message = 'Database error';
        code = err.code;
    }
  }

  // Handle non-Prisma or driver-level schema drift errors consistently.
  if (isSchemaMismatchError(err)) {
    statusCode = 503;
    message = 'Database schema is updating. Please retry in a few seconds';
    code = 'DB_SCHEMA_MISMATCH';
  }

  // Handle transient DB outages/timeouts consistently.
  if (isTransientDbError(err)) {
    statusCode = 503;
    message = 'Database is temporarily unavailable. Please retry in a few seconds';
    code = 'DB_UNAVAILABLE';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  // Validation errors from Multer (file upload)
  if (err.name === 'MulterError') {
    statusCode = 400;
    code = err.code || 'UPLOAD_ERROR';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Too many files uploaded';
    }
  }

  // CORS errors from cors middleware callback
  if (err.message === 'Not allowed by CORS') {
    statusCode = 403;
    message = 'Origin not allowed by CORS policy';
    code = 'CORS_ORIGIN_BLOCKED';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  if (requestId) {
    res.setHeader('X-Request-Id', String(requestId));
    if (!errors || typeof errors !== 'object' || Array.isArray(errors)) {
      errors = { requestId };
    } else if (!errors.requestId) {
      errors = { ...errors, requestId };
    }
  }

  // Send error response
  return ApiResponse.error(res, statusCode, message, errors, code);
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
