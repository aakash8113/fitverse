// Admin Business Controller
// Admin endpoints for managing business accounts

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * GET /api/admin/businesses
 * List all business accounts with their credit balance
 */
const getBusinesses = asyncHandler(async (req, res) => {
  const businesses = await prisma.user.findMany({
    where: { role: 'BUSINESS' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
      businessCredits: true,
      _count: { select: { businessApiKeys: true, aiUsage: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return ApiResponse.success(res, 200, businesses, 'Businesses retrieved');
});

/**
 * PUT /api/admin/businesses/:id/credits
 * Adjust business credits
 */
const adjustBusinessCredits = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount || isNaN(parseInt(amount))) {
    throw new BadRequestError('A valid numeric amount is required');
  }

  const parsedAmount = parseInt(amount);

  const business = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, businessCredits: true },
  });

  if (!business) throw new NotFoundError('Business not found');
  if (business.role !== 'BUSINESS') throw new BadRequestError('User is not a business');

  // Prevent negative balance
  if (parsedAmount < 0 && (business.businessCredits + parsedAmount) < 0) {
    throw new BadRequestError(`Cannot deduct ${Math.abs(parsedAmount)} — only ${business.businessCredits} credits available`);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { businessCredits: { increment: parsedAmount } },
    select: { id: true, name: true, businessCredits: true },
  });

  logger.info(`Admin adjusted business credits for ${business.email}: ${parsedAmount} (new balance: ${updated.businessCredits})`);

  return ApiResponse.success(res, 200, updated, `Credits ${parsedAmount > 0 ? 'added' : 'deducted'}`);
});

module.exports = {
  getBusinesses,
  adjustBusinessCredits,
};