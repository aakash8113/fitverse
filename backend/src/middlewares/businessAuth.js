// B2B API Key Auth Middleware
// Authenticates businesses via x-api-key header

const crypto = require('crypto');
const prisma = require('../config/database');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

/**
 * Hash an API key using SHA-256
 */
const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * Generate a new API key (returns the raw key and its hash)
 */
const generateApiKey = () => {
  const raw = `fv_${crypto.randomBytes(24).toString('hex')}`;
  const hash = hashApiKey(raw);
  const prefix = raw.substring(0, 10) + '...';
  return { raw, hash, prefix };
};

/**
 * Authenticate a business via x-api-key header
 * Attaches req.business (the User record) and req.apiKeyId on success
 */
const authenticateBusinessApiKey = async (req, _res, next) => {
  // Support JWT auth for business dashboard (frontend uses Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const config = require('../config/env');
      const decoded = jwt.verify(authHeader.split(' ')[1], config.jwt.secret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true, businessCredits: true },
      });
      if (user && (user.role === 'BUSINESS' || user.role === 'ADMIN')) {
        req.business = user;
        return next();
      }
    } catch (e) {
      // JWT invalid — fall through to API key check
    }
  }

  // Fallback: x-api-key header for external API clients
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    throw new UnauthorizedError('API key is required. Provide it via x-api-key header');
  }

  const keyHash = hashApiKey(apiKey);
  const keyRecord = await prisma.businessApiKey.findUnique({
    where: { keyHash },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          businessCredits: true,
        },
      },
    },
  });

  if (!keyRecord || !keyRecord.isActive) {
    throw new UnauthorizedError('Invalid or inactive API key');
  }

  if (keyRecord.business.role !== 'BUSINESS') {
    throw new ForbiddenError('Account is not a business');
  }

  req.business = keyRecord.business;
  req.businessApiKeyId = keyRecord.id;

  prisma.businessApiKey
    .update({ where: { id: keyRecord.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  next();
};

module.exports = { authenticateBusinessApiKey, generateApiKey, hashApiKey };