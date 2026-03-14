// Server Entry Point
// Starts the Express server and handles graceful shutdown

// Load environment configuration first
require('./src/config/env');

const { execSync } = require('child_process');

const app = require('./src/app');
const config = require('./src/config/env');
const logger = require('./src/config/logger');
const prisma = require('./src/config/database');

const PORT = config.port;

const REQUIRED_TABLES = [
  'reviews',
  'review_helpful',
  'coupons',
  'coin_transactions',
  'carousel_slides',
  'return_requests',
];

const REQUIRED_COLUMNS = [
  ['users', 'coinBalance'],
  ['products', 'sizeStock'],
  ['products', 'availableSizes'],
  ['products', 'isThrift'],
  ['products', 'thriftCondition'],
  ['cart_items', 'size'],
  ['order_items', 'size'],
];

const runDbPush = () => {
  logger.warn('Running schema auto-sync: prisma db push --skip-generate');
  execSync('npx prisma db push --skip-generate', {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env,
  });
};

const getSchemaDrift = async () => {
  const missingTables = [];
  const missingColumns = [];

  for (const table of REQUIRED_TABLES) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT to_regclass('public.${table}')::text AS table_name`
    );
    if (!rows?.[0]?.table_name) {
      missingTables.push(table);
    }
  }

  for (const [table, column] of REQUIRED_COLUMNS) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = $1
           AND column_name = $2
       ) AS present`,
      table,
      column
    );

    if (!rows?.[0]?.present) {
      missingColumns.push(`${table}.${column}`);
    }
  }

  return { missingTables, missingColumns };
};

const ensureDatabaseSchemaReady = async () => {
  await prisma.$connect();

  let drift = await getSchemaDrift();
  const hasDrift = drift.missingTables.length > 0 || drift.missingColumns.length > 0;

  if (!hasDrift) {
    logger.info('Database schema check passed');
    return;
  }

  logger.error(
    `Database schema drift detected. Missing tables: [${drift.missingTables.join(', ')}], missing columns: [${drift.missingColumns.join(', ')}]`
  );

  const autoSyncEnabled = String(process.env.AUTO_DB_SYNC || 'true').toLowerCase() !== 'false';
  if (!autoSyncEnabled) {
    throw new Error('Database schema is out of sync and AUTO_DB_SYNC is disabled');
  }

  runDbPush();
  drift = await getSchemaDrift();

  if (drift.missingTables.length > 0 || drift.missingColumns.length > 0) {
    throw new Error(
      `Schema auto-sync incomplete. Missing tables: [${drift.missingTables.join(', ')}], missing columns: [${drift.missingColumns.join(', ')}]`
    );
  }

  logger.info('Database schema auto-sync completed successfully');
};

let server;

const startServer = async () => {
  await ensureDatabaseSchemaReady();

  server = app.listen(PORT, () => {
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
};

startServer().catch(async (error) => {
  logger.error(`Failed to start server: ${error.message}`, { error: error.stack });
  try {
    await prisma.$disconnect();
  } catch (_) {
    // noop
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  logger.info('🛑 Shutting down gracefully...');

  if (!server) {
    try {
      await prisma.$disconnect();
    } catch (_) {
      // noop
    }
    process.exit(0);
  }
  
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
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

module.exports = server;
