// Server Entry Point
// Starts the Express server and handles graceful shutdown

// Load environment configuration first
require('./src/config/env');

const app = require('./src/app');
const config = require('./src/config/env');
const logger = require('./src/config/logger');
const prisma = require('./src/config/database');

const PORT = config.port;

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running in ${config.env} mode on port ${PORT}`);
  logger.info(`📍 API available at: http://localhost:${PORT}/api`);
  logger.info(`🏥 Health check at: http://localhost:${PORT}/health`);
  console.log(`\n✅ Fitverse Backend Server Started Successfully!`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📦 Environment: ${config.env}`);
  console.log(`\n📚 API Endpoints:`);
  console.log(`   - Auth:      POST   /api/auth/signup`);
  console.log(`   - Auth:      POST   /api/auth/login`);
  console.log(`   - Products:  GET    /api/products`);
  console.log(`   - Cart:      GET    /api/cart`);
  console.log(`   - Orders:    POST   /api/orders`);
  console.log(`   - Addresses: GET    /api/addresses`);
  console.log(`\n🔐 Test Admin Account (will be created in seed):`);
  console.log(`   Email:    admin@fitverse.com`);
  console.log(`   Password: admin123`);
  console.log(`\n💡 Run 'npm run prisma:seed' to populate sample data\n`);
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  logger.info('🛑 Shutting down gracefully...');
  
  // Stop accepting new connections
  server.close(async () => {
    logger.info('✅ HTTP server closed');

    // Close database connection
    try {
      await prisma.$disconnect();
      logger.info('✅ Database connection closed');
    } catch (error) {
      logger.error('❌ Error closing database:', error);
    }

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('❌ Unhandled Promise Rejection:', error);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;
