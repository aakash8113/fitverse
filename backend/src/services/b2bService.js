// B2B Service
// Handles B2B AI try-on API logic — credit deduction, task management

const prisma = require('../config/database');
const { BadRequestError } = require('../utils/errors');
const logger = require('../config/logger');

const CREDIT_COST_PER_TASK = 1;

class B2BService {
  /**
   * Check if business has enough credits and deduct one
   */
  async deductCredit(businessId) {
    const business = await prisma.user.findUnique({
      where: { id: businessId },
      select: { businessCredits: true },
    });

    if (!business) throw new BadRequestError('Business not found');
    if (business.businessCredits < CREDIT_COST_PER_TASK) {
      throw new BadRequestError('Insufficient credits. Please purchase more credits.');
    }

    await prisma.user.update({
      where: { id: businessId },
      data: { businessCredits: { decrement: CREDIT_COST_PER_TASK } },
    });

    return true;
  }

  /**
   * Get business credit balance
   */
  async getBalance(businessId) {
    const business = await prisma.user.findUnique({
      where: { id: businessId },
      select: { businessCredits: true },
    });
    return business?.businessCredits || 0;
  }

  /**
   * Get usage history for a business
   */
  async getUsageHistory(businessId, query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: businessId };

    const [items, total] = await Promise.all([
      prisma.aiUsage.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.aiUsage.count({ where }),
    ]);

    return {
      items,
      pagination: {
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
        totalItems: total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Get all API keys for a business
   */
  async getApiKeys(businessId) {
    const keys = await prisma.businessApiKey.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
    return keys;
  }
}

module.exports = new B2BService();