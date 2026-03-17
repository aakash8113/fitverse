// Prisma Client Instance
// Singleton pattern to prevent multiple instances in development

const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['warn', 'error']
    : ['error'],
});

const TRANSIENT_DB_ERROR_PATTERNS = [
  'P1001',
  'P1002',
  'P1017',
  'P2024',
  'Can\'t reach database server',
  'Server has closed the connection',
  'Connection terminated unexpectedly',
  'Timed out fetching a new connection',
  'Connection reset',
  'remaining connection slots are reserved',
  'too many clients',
  'terminating connection due to administrator command',
  'connection pool timeout',
  'ETIMEDOUT',
  'ECONNRESET',
  'EPIPE',
];

const isTransientDbError = (error) => {
  if (!error) return false;
  const raw = `${error.code || ''} ${error.message || ''} ${error.meta?.cause || ''}`;
  return TRANSIENT_DB_ERROR_PATTERNS.some((pattern) => raw.includes(pattern));
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry transient DB failures to prevent random 500s on login/products/cart/order flows.
prisma.$use(async (params, next) => {
  const maxAttempts = 3;
  let attempt = 0;
  let lastError;

  while (attempt < maxAttempts) {
    try {
      return await next(params);
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (!isTransientDbError(error) || attempt >= maxAttempts) {
        throw error;
      }

      const delayMs = attempt * 350;
      logger.warn(
        `Transient DB error on ${params.model}.${params.action} (attempt ${attempt}/${maxAttempts}): ${error.message}`
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
});

// Gracefully disconnect on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
