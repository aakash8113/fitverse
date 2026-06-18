// Admin Seller Service
// Business logic for admin to manage seller product approvals

const prisma = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../config/logger');

class AdminSellerService {
  /**
   * Get all seller products that need admin attention
   * status filter: REQUESTED | PRICE_UPDATE_REQUESTED | APPROVED | REJECTED | ALL
   */
  async getSellerRequests(query = {}) {
    const { page = 1, limit = 20, status } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      sellerId: { not: null },
      isThrift: false,
      isActive: status === 'REJECTED' ? false : undefined,
    };

    if (status && status !== 'ALL') {
      where.sellerApprovalStatus = status;
    } else {
      where.sellerApprovalStatus = { not: null };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
        totalItems: total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Approve a seller product
   * - REQUESTED -> APPROVED: Sets admin's final price, makes product live
   * - PRICE_UPDATE_REQUESTED -> APPROVED: Updates the live price to seller's new requested price
   */
  async approveSellerProduct(productId, adminFinalPrice) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError('Product not found');
    if (!product.sellerId) throw new BadRequestError('This is not a seller product');
    if (product.sellerApprovalStatus === 'APPROVED') {
      throw new BadRequestError('Product is already approved');
    }
    if (product.sellerApprovalStatus === 'REJECTED') {
      throw new BadRequestError('Cannot approve a rejected product');
    }

    const finalPrice = Math.round(parseFloat(adminFinalPrice) * 100) / 100;
    if (!finalPrice || finalPrice <= 0) {
      throw new BadRequestError('A valid final price is required');
    }

    const oldPrice = parseFloat(product.price.toString());

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        price: finalPrice,
        sellerApprovalStatus: 'APPROVED',
        isActive: true,
      },
      include: {
        seller: { select: { id: true, name: true, email: true } },
      },
    });

    logger.info(
      `Admin approved seller product ${productId}. ` +
      `Seller price: ${product.sellerPrice}, Admin price: ${finalPrice}, ` +
      `Old status: ${product.sellerApprovalStatus}`
    );

    return updated;
  }

  /**
   * Reject a seller product
   */
  async rejectSellerProduct(productId, reason) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError('Product not found');
    if (!product.sellerId) throw new BadRequestError('This is not a seller product');
    if (product.sellerApprovalStatus === 'APPROVED') {
      throw new BadRequestError('Cannot reject an already approved product');
    }
    if (product.sellerApprovalStatus === 'REJECTED') {
      throw new BadRequestError('Product is already rejected');
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        sellerApprovalStatus: 'REJECTED',
        isActive: false,
      },
      include: {
        seller: { select: { id: true, name: true, email: true } },
      },
    });

    logger.info(`Admin rejected seller product ${productId}. Reason: ${reason || 'No reason provided'}`);
    return updated;
  }

  /**
   * Get pending count for admin dashboard
   */
  async getPendingCount() {
    const count = await prisma.product.count({
      where: {
        sellerId: { not: null },
        isThrift: false,
        sellerApprovalStatus: { in: ['REQUESTED', 'PRICE_UPDATE_REQUESTED'] },
      },
    });
    return count;
  }
}

module.exports = new AdminSellerService();