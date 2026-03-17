// Express Application Setup
// Main application configuration with middleware and routes

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const prisma = require('./config/database');

// Config
const logger = require('./config/logger');
const config = require('./config/env');
const { helmetConfig, corsOptions, limiter } = require('./middlewares/security');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const addressRoutes = require('./routes/addressRoutes');
const adminRoutes = require('./routes/adminRoutes');
const thriftRoutes = require('./routes/thriftRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const returnRoutes = require('./routes/returnRoutes');
const coinRoutes = require('./routes/coinRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const carouselRoutes = require('./routes/carouselRoutes');

// Create Express app
const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);
app.use(cors(corsOptions));

// Per-request tracing + timeout protection to avoid hanging requests behind proxies.
app.use((req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  req.requestId = typeof incomingId === 'string' && incomingId.trim().length > 0
    ? incomingId.trim()
    : crypto.randomUUID();

  const startedAt = Date.now();
  res.setHeader('X-Request-Id', req.requestId);

  res.setTimeout(config.server.routeTimeoutMs, () => {
    if (!res.headersSent) {
      logger.error(`Request timed out (${config.server.routeTimeoutMs}ms): ${req.method} ${req.originalUrl} [${req.requestId}]`);
      res.status(503).json({
        success: false,
        message: 'Request timeout. Please retry',
        code: 'REQUEST_TIMEOUT',
      });
    }
  });

  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    if (duration >= config.server.slowRequestMs) {
      logger.warn(`Slow request (${duration}ms): ${req.method} ${req.originalUrl} -> ${res.statusCode} [${req.requestId}]`);
    }
  });

  next();
});

// Body parsing middleware
// capture rawBody for PhonePe webhook signature validation
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    if (req.originalUrl && req.originalUrl.includes('/payment/webhook')) {
      req.rawBody = buf.toString('utf8');
    }
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
app.use('/api/', limiter);

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', async (req, res) => {
  const timeoutMs = 2500;
  const dbPing = prisma.$queryRawUnsafe('SELECT 1 AS ok');
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('DB health check timeout')), timeoutMs);
  });

  try {
    await Promise.race([dbPing, timeout]);
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'up',
      uptimeSeconds: Math.floor(process.uptime()),
    });
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'down',
      code: 'HEALTHCHECK_DB_FAILED',
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/thrift/listings', thriftRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/carousels', carouselRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Fitverse Ecommerce API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      addresses: '/api/addresses',
    },
  });
});

// 404 Handler (must be after all routes)
app.use(notFoundHandler);

// Error Handler (must be last)
app.use(errorHandler);

module.exports = app;
