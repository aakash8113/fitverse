// Coupon Controller
// Handles coupon validation (user) and full CRUD + admin controls

const prisma = require('../config/database');
const couponService = require('../services/couponService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { BadRequestError, NotFoundError } = require('../utils/errors');

// ============================================
// USER
// ============================================

/**
 * POST /api/coupons/validate
 * Validates a coupon code against the user's current cart and returns the discount amount.
 */
const validateCoupon = asyncHandler(async (req, res) => {
  const { couponCode, productIds } = req.body;
  if (!couponCode) throw new BadRequestError('couponCode is required');

  const userId = req.user.id;

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw new BadRequestError('Cart is empty');
  }

  const cartItems = productIds?.length
    ? cart.items.filter((i) => productIds.includes(i.productId))
    : cart.items;

  if (cartItems.length === 0) {
    throw new BadRequestError('No matching items found in cart');
  }

  const result = await couponService.validateCoupon(userId, couponCode, cartItems);
  return ApiResponse.success(res, 200, result, 'Coupon is valid');
});

// ============================================
// ADMIN — LIST / GET
// ============================================

/**
 * GET /api/coupons/admin
 * Returns paginated list of all coupons with usage counts.
 */
const listCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isActive, search } = req.query;

  const where = {};
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) where.code = { contains: search.toUpperCase().trim() };

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      include: {
        _count: { select: { usages: true, products: true, blockedUsers: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.coupon.count({ where }),
  ]);

  return ApiResponse.success(res, 200, {
    coupons,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
    },
  });
});

/**
 * GET /api/coupons/admin/:id
 * Full detail of a single coupon including linked products and blocked users.
 */
const getCoupon = asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id: req.params.id },
    include: {
      products: {
        include: {
          product: { select: { id: true, name: true, images: true, isThrift: true } },
        },
      },
      blockedUsers: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { usages: true } },
    },
  });

  if (!coupon) throw new NotFoundError('Coupon not found');
  return ApiResponse.success(res, 200, coupon);
});

// ============================================
// ADMIN — CREATE
// ============================================

/**
 * POST /api/coupons/admin
 * Creates a new coupon.  For PRODUCT scope, pass productIds[].
 */
const createCoupon = asyncHandler(async (req, res) => {
  const d = req.body;

  if (!d.code) throw new BadRequestError('code is required');
  if (!d.discountType) throw new BadRequestError('discountType is required');
  if (d.discountValue === undefined) throw new BadRequestError('discountValue is required');

  // Check code uniqueness (case-insensitive)
  const exists = await prisma.coupon.findUnique({
    where: { code: d.code.toUpperCase().trim() },
  });
  if (exists) throw new BadRequestError('A coupon with this code already exists');

  const coupon = await prisma.coupon.create({
    data: {
      code: d.code.toUpperCase().trim(),
      description: d.description || null,
      discountType: d.discountType,
      discountValue: parseFloat(d.discountValue),
      maxDiscountAmount: d.maxDiscountAmount != null ? parseFloat(d.maxDiscountAmount) : null,
      minOrderAmount: d.minOrderAmount != null ? parseFloat(d.minOrderAmount) : null,
      totalUsageLimit: d.totalUsageLimit != null ? parseInt(d.totalUsageLimit) : null,
      perUserLimit: parseInt(d.perUserLimit ?? 1),
      isFirstOrderOnly: d.isFirstOrderOnly ?? false,
      applicableTo: d.applicableTo ?? 'SHOP',
      scope: d.scope ?? 'ALL',
      applicableGenders: d.applicableGenders ?? [],
      applicableWearTypes: d.applicableWearTypes ?? [],
      applicableCategories: d.applicableCategories ?? [],
      isActive: d.isActive ?? true,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
      ...(d.scope === 'PRODUCT' && d.productIds?.length
        ? {
            products: {
              create: d.productIds.map((pid) => ({ productId: pid })),
            },
          }
        : {}),
    },
  });

  return ApiResponse.success(res, 201, coupon, 'Coupon created successfully');
});

// ============================================
// ADMIN — UPDATE
// ============================================

/**
 * PUT /api/coupons/admin/:id
 * Updates any coupon field.  Replaces the full product list if productIds is supplied.
 */
const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const d = req.body;

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Coupon not found');

  const updated = await prisma.$transaction(async (tx) => {
    const coupon = await tx.coupon.update({
      where: { id },
      data: {
        ...(d.code !== undefined && { code: d.code.toUpperCase().trim() }),
        ...(d.description !== undefined && { description: d.description }),
        ...(d.discountType !== undefined && { discountType: d.discountType }),
        ...(d.discountValue !== undefined && { discountValue: parseFloat(d.discountValue) }),
        ...(d.maxDiscountAmount !== undefined && {
          maxDiscountAmount: d.maxDiscountAmount != null ? parseFloat(d.maxDiscountAmount) : null,
        }),
        ...(d.minOrderAmount !== undefined && {
          minOrderAmount: d.minOrderAmount != null ? parseFloat(d.minOrderAmount) : null,
        }),
        ...(d.totalUsageLimit !== undefined && {
          totalUsageLimit: d.totalUsageLimit != null ? parseInt(d.totalUsageLimit) : null,
        }),
        ...(d.perUserLimit !== undefined && { perUserLimit: parseInt(d.perUserLimit) }),
        ...(d.isFirstOrderOnly !== undefined && { isFirstOrderOnly: d.isFirstOrderOnly }),
        ...(d.applicableTo !== undefined && { applicableTo: d.applicableTo }),
        ...(d.scope !== undefined && { scope: d.scope }),
        ...(d.applicableGenders !== undefined && { applicableGenders: d.applicableGenders }),
        ...(d.applicableWearTypes !== undefined && { applicableWearTypes: d.applicableWearTypes }),
        ...(d.applicableCategories !== undefined && { applicableCategories: d.applicableCategories }),
        ...(d.isActive !== undefined && { isActive: d.isActive }),
        ...(d.startsAt !== undefined && { startsAt: d.startsAt ? new Date(d.startsAt) : null }),
        ...(d.expiresAt !== undefined && { expiresAt: d.expiresAt ? new Date(d.expiresAt) : null }),
      },
    });

    // Replace product list when explicitly provided
    if (d.productIds !== undefined) {
      await tx.couponProduct.deleteMany({ where: { couponId: id } });
      if (d.productIds.length > 0) {
        await tx.couponProduct.createMany({
          data: d.productIds.map((pid) => ({ couponId: id, productId: pid })),
          skipDuplicates: true,
        });
      }
    }

    return coupon;
  });

  return ApiResponse.success(res, 200, updated, 'Coupon updated successfully');
});

// ============================================
// ADMIN — DELETE
// ============================================

/**
 * DELETE /api/coupons/admin/:id
 * Permanently deletes a coupon (usages are cascade-deleted).
 */
const deleteCoupon = asyncHandler(async (req, res) => {
  const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new NotFoundError('Coupon not found');
  await prisma.coupon.delete({ where: { id: req.params.id } });
  return ApiResponse.success(res, 200, null, 'Coupon deleted successfully');
});

// ============================================
// ADMIN — USAGE HISTORY
// ============================================

/**
 * GET /api/coupons/admin/:id/usages
 * Lists every order that used this coupon.
 */
const getCouponUsages = asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!coupon) throw new NotFoundError('Coupon not found');

  const usages = await prisma.couponUsage.findMany({
    where: { couponId: req.params.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return ApiResponse.success(res, 200, usages);
});

// ============================================
// ADMIN — BLOCK / UNBLOCK USER
// ============================================

/**
 * POST /api/coupons/admin/:id/block-user
 * Prevents a specific user from ever using this coupon.
 * Body: { userId }
 */
const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) throw new BadRequestError('userId is required');

  const [coupon, user] = await Promise.all([
    prisma.coupon.findUnique({ where: { id: req.params.id } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
  ]);

  if (!coupon) throw new NotFoundError('Coupon not found');
  if (!user) throw new NotFoundError('User not found');

  await prisma.couponBlockedUser.upsert({
    where: { couponId_userId: { couponId: req.params.id, userId } },
    create: { couponId: req.params.id, userId },
    update: {},
  });

  return ApiResponse.success(res, 200, null, 'User blocked from this coupon');
});

/**
 * DELETE /api/coupons/admin/:id/block-user/:userId
 * Removes a user block so they can use this coupon again.
 */
const unblockUser = asyncHandler(async (req, res) => {
  await prisma.couponBlockedUser.deleteMany({
    where: { couponId: req.params.id, userId: req.params.userId },
  });
  return ApiResponse.success(res, 200, null, 'User unblocked from this coupon');
});

// ============================================
// ADMIN — RESET USAGE COUNT
// ============================================

/**
 * POST /api/coupons/admin/:id/reset-usage
 * Resets the global usageCount to 0 (does not delete CouponUsage history).
 */
const resetUsageCount = asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!coupon) throw new NotFoundError('Coupon not found');

  await prisma.coupon.update({
    where: { id: req.params.id },
    data: { usageCount: 0 },
  });

  return ApiResponse.success(res, 200, null, 'Usage count reset to 0');
});

module.exports = {
  validateCoupon,
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponUsages,
  blockUser,
  unblockUser,
  resetUsageCount,
};
