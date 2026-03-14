// Security Middleware
// Rate limiting, Helmet, CORS configuration

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const config = require('../config/env');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

/**
 * Rate Limiter
 * Prevents brute force attacks and API abuse
 */
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes default
  max: config.rateLimit.maxRequests, // 100 requests per window default
  keyGenerator: getClientIp,
  skip: (req) => {
    // Avoid throttling read-only browsing routes in production.
    if (req.method === 'GET') {
      const url = req.originalUrl || '';
      return (
        url.startsWith('/api/products') ||
        url.startsWith('/api/thrift/listings/stats') ||
        url.startsWith('/api/carousels') ||
        url.startsWith('/health')
      );
    }
    return false;
  },
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Strict Rate Limiter for Auth Routes
 * More restrictive for sensitive endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  keyGenerator: getClientIp,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP request endpoints: signup verification resend and forgot password
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: getClientIp,
  message: 'Too many OTP requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP verify endpoints: verify-email and reset-password
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: getClientIp,
  message: 'Too many OTP verification attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Helmet Configuration
 * Sets various HTTP headers for security
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * CORS Configuration
 * Allows requests from frontend
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const configuredOrigins = String(config.frontend.url || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const allowedOrigins = [
      ...configuredOrigins,
      'https://fitverse.co.in',
      'https://www.fitverse.co.in',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ];

    const isPreviewHost = /https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
      || /https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin);

    if (allowedOrigins.indexOf(origin) !== -1 || isPreviewHost || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200,
};

module.exports = {
  limiter,
  authLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  helmetConfig,
  corsOptions,
};
