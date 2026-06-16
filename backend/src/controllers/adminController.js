// Admin Controller
// Production admin endpoints: stats, users, and order management

// Round a value to 2 decimal places — avoids floating point drift (e.g. 200 → 199.97)
const toMoney = (val) => val != null && val !== '' ? Math.round(parseFloat(val) * 100) / 100 : null;

const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/database');
const imageService = require('../services/imageService');
const productService = require('../services/productService');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../config/logger');
const { isSchemaMismatchError, isTransientDbError } = require('../utils/dbErrors');

const syncThriftListingStatus = async (tx, listingId) => {
  const remainingItems = await tx.thriftItem.findMany({
    where: { listingId },
    select: { status: true },
  });

  if (remainingItems.length === 0) {
    await tx.thriftListing.delete({ where: { id: listingId } });
    return;
  }

  const activeStatuses = remainingItems
    .map((item) => item.status)
    .filter((status) => status !== 'REJECTED');

  let nextStatus = 'PENDING';
  if (activeStatuses.length === 0) {
    nextStatus = 'REJECTED';
  } else if (activeStatuses.every((status) => ['LISTED', 'SOLD'].includes(status))) {
    nextStatus = 'COMPLETED';
  } else if (activeStatuses.some((status) => ['PICKED_UP', 'UNDER_REFURBISHMENT', 'REFURBISHMENT_COMPLETE', 'LISTED', 'SOLD'].includes(status))) {
    nextStatus = 'PICKED_UP';
  } else if (activeStatuses.some((status) => status === 'APPROVED')) {
    nextStatus = 'APPROVED';
  }

  await tx.thriftListing.update({
    where: { id: listingId },
    data: { status: nextStatus },
  });
};

// ============================================
// DASHBOARD STATS
// ============================================

/**
 * GET /api/admin/stats
 * Returns aggregated dashboard statistics
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const safe = async (label, fn, fallback) => {
    try {
      return await fn();
    } catch (error) {
      const kind = isSchemaMismatchError(error)
        ? 'schema-mismatch'
        : isTransientDbError(error)
          ? 'transient-db'
          : 'unknown-db';
      logger.error(`Admin stats subquery failed (${label}, ${kind}): ${error.message}`);
      return fallback;
    }
  };

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalThriftListings,
    aiTryOnCount,
    ordersByMonth,
    creditPurchasesByMonth,
    recentOrders,
    categoryGroups,
  ] = await Promise.all([
    safe('totalUsers', () => prisma.user.count({ where: { role: 'USER' } }), 0),
    safe('totalProducts', () => prisma.product.count({ where: { isActive: true } }), 0),
    safe('totalOrders', () => prisma.order.count(), 0),
    safe('totalThriftListings', () => prisma.thriftListing.count(), 0),
    safe('aiTryOnCount', () => prisma.aiUsage.count({ where: { success: true } }), 0),
    safe('ordersByMonth', () => prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
        status: { notIn: ['CANCELLED'] },
      },
      select: { total: true, createdAt: true },
    }), []),
    safe('creditPurchasesByMonth', () => prisma.aiCreditPurchase.findMany({
      where: {
        createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
        status: 'COMPLETED',
      },
      select: { amountInPaise: true, createdAt: true },
    }), []),
    safe('recentOrders', () => prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        orderItems: { select: { id: true } },
      },
    }), []),
    safe('categoryGroups', () => prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { _all: true },
    }), []),
  ]);

  // Monthly revenue for current year
  const now = new Date();

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueByMonth = monthNames.map((month, i) => ({
    month,
    revenue: ordersByMonth
      .filter((o) => new Date(o.createdAt).getMonth() === i)
      .reduce((sum, o) => sum + parseFloat(o.total?.toString() || '0'), 0)
      + creditPurchasesByMonth
        .filter((p) => new Date(p.createdAt).getMonth() === i)
        .reduce((sum, p) => sum + (p.amountInPaise || 0) / 100, 0),
  }));

  const monthlyRevenue = revenueByMonth[now.getMonth()].revenue;

  const formatCategoryLabel = (value) => {
    if (!value) return 'Other';
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const inventoryByCategory = [
    ...categoryGroups.map((g) => ({
      category: formatCategoryLabel(g.category),
      count: g._count._all,
    })),
  ]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalProducts,
      totalOrders,
      monthlyRevenue,
      thriftRequestCount: totalThriftListings,
      aiTryOnCount,
      revenueByMonth,
      inventoryByCategory,
      recentOrders,
    },
  });
});

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * GET /api/admin/users
 * Returns all users with order count
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      coinBalance: true,
      aiCredits: true,
      aiTryOnCount: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: users });
});

/**
 * GET /api/admin/users/:id
 * Returns a single user profile
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      coinBalance: true,
      aiCredits: true,
      aiTryOnCount: true,
      createdAt: true,
      updatedAt: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { orderItems: true },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!user) throw new NotFoundError('User not found');
  res.json({ success: true, data: user });
});

/**
 * GET /api/admin/users/:id/orders
 * Returns a user's order history
 */
const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.params.id },
    include: { orderItems: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: orders });
});

/**
 * GET /api/admin/ai-usage
 * Returns AI usage summary per user
 */
const getAiUsageSummary = asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      name: true,
      email: true,
      aiCredits: true,
      aiTryOnCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const userIds = users.map((u) => u.id);
  if (userIds.length === 0) {
    return res.json({ success: true, data: [] });
  }

  const [usageTotals, successTotals, purchases] = await Promise.all([
    prisma.aiUsage.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { _all: true },
    }),
    prisma.aiUsage.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, success: true },
      _count: { _all: true },
    }),
    prisma.aiCreditPurchase.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalMap = new Map(usageTotals.map((row) => [row.userId, row._count._all]));
  const successMap = new Map(successTotals.map((row) => [row.userId, row._count._all]));
  const purchaseMap = purchases.reduce((acc, purchase) => {
    if (!acc[purchase.userId]) acc[purchase.userId] = [];
    acc[purchase.userId].push(purchase);
    return acc;
  }, {});

  const data = users.map((user) => {
    const total = totalMap.get(user.id) || 0;
    const success = successMap.get(user.id) || 0;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
    return {
      ...user,
      totalTryOns: total,
      successRate,
      purchases: purchaseMap[user.id] || [],
    };
  });

  res.json({ success: true, data });
});

/**
 * PUT /api/admin/users/:id/block
 * Block a user (note: requires isBlocked field in schema - placeholder)
 */
const blockUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new NotFoundError('User not found');

  // NOTE: To fully implement blocking, add `isBlocked Boolean @default(false)`
  // to User model in schema.prisma and run `npx prisma migrate dev`
  res.json({
    success: true,
    message: 'Block feature requires schema migration. Add isBlocked field to User model.',
    data: { ...user, isBlocked: true },
  });
});

/**
 * PUT /api/admin/users/:id/unblock
 */
const unblockUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new NotFoundError('User not found');

  res.json({
    success: true,
    message: 'Unblock feature requires schema migration.',
    data: { ...user, isBlocked: false },
  });
});

// ============================================
// ORDER MANAGEMENT (Admin extended view)
// ============================================

/**
 * GET /api/admin/orders
 * Returns all orders with full details
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const where = status ? { status } : {};
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        orderItems: {
          include: {
            product: { select: { name: true, images: true, price: true } },
          },
        },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.order.count({ where }),
  ]);

  // Map response to include shipping fields in a user-friendly way
  const ordersWithShipping = orders.map((order) => ({
    ...order,
    shippingInfo: order.shippingMethod ? {
      method: order.shippingMethod,
      courierName: order.courierName,
      awbCode: order.awbCode,
      trackingUrl: order.trackingUrl,
      courierId: order.courierId,
      labelUrl: order.labelUrl,
      shipmentId: order.shipmentId,
      pickupScheduledAt: order.pickupScheduledAt,
    } : null,
  }));

  res.json({
    success: true,
    data: ordersWithShipping,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

// ============================================
// ADMIN THRIFT MANAGEMENT
// ============================================

/**
 * GET /api/admin/thrift/requests
 * All thrift listing requests with pagination + status filter
 */
const getAllThriftListings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = status ? { status } : {};

  const [listings, total] = await Promise.all([
    prisma.thriftListing.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: true,
        pickupAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.thriftListing.count({ where }),
  ]);

  res.json({
    success: true,
    data: listings,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

/**
 * GET /api/admin/thrift/requests/:id
 * Single listing with full details
 */
const getThriftListingById = asyncHandler(async (req, res) => {
  const listing = await prisma.thriftListing.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: true,
      pickupAddress: true,
    },
  });

  if (!listing) throw new NotFoundError('Listing not found');
  res.json({ success: true, data: listing });
});

/**
 * PUT /api/admin/thrift/requests/:id/review
 * Admin reviews a PENDING listing: sets per-item offer prices, proposed pickup date.
 * Status is moved to OFFER_SENT (awaiting user accept/decline), not directly to APPROVED.
 * Body: {
 *   decision: 'OFFER' | 'REJECTED',
 *   pickupDate?: string,
 *   pickupSlot?: string,
 *   adminNotes?: string,
 *   items: [{ id, approved: bool, estimatedValue?: number, rejectionReason?: string }]
 * }
 */
const reviewThriftListing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { decision, pickupDate, pickupSlot, adminNotes, items } = req.body;

  const listing = await prisma.thriftListing.findUnique({ where: { id } });
  if (!listing) throw new NotFoundError('Listing not found');
  if (listing.status !== 'PENDING') {
    throw new BadRequestError('Listing has already been reviewed');
  }

  if (!['OFFER', 'REJECTED'].includes(decision)) {
    throw new BadRequestError('Decision must be OFFER or REJECTED');
  }

  // Update each item individually
  if (Array.isArray(items) && items.length > 0) {
    await Promise.all(
      items.map((item) =>
        prisma.thriftItem.update({
          where: { id: item.id },
          data: {
            status: item.approved ? 'APPROVED' : 'REJECTED',
            estimatedValue: item.estimatedValue != null ? toMoney(item.estimatedValue) : null,
            rejectionReason: item.rejectionReason || null,
            adminNotes: item.adminNotes || null,
          },
        })
      )
    );
  }

  const newStatus = decision === 'OFFER' ? 'OFFER_SENT' : 'REJECTED';

  const updatedListing = await prisma.thriftListing.update({
    where: { id },
    data: {
      status: newStatus,
      pickupDate: decision === 'OFFER' && pickupDate ? new Date(pickupDate) : null,
      pickupSlot: pickupSlot || null,
      adminNotes: adminNotes || null,
      contactRequested: false,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: true,
    },
  });

  const msg = decision === 'OFFER' ? 'Offer sent to user' : 'Listing rejected';
  res.json({ success: true, data: updatedListing, message: msg });
});

/**
 * PUT /api/admin/thrift/requests/:id/offer
 * Admin edits an already-sent offer (when status is OFFER_SENT).
 * Re-sends the offer with updated prices / date / note.
 * Body: same as review
 */
const updateThriftOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { pickupDate, pickupSlot, adminNotes, items } = req.body;

  const listing = await prisma.thriftListing.findUnique({ where: { id } });
  if (!listing) throw new NotFoundError('Listing not found');
  if (listing.status !== 'OFFER_SENT') {
    throw new BadRequestError('Can only edit an offer that is in OFFER_SENT state');
  }

  // Update per-item estimated values
  if (Array.isArray(items) && items.length > 0) {
    await Promise.all(
      items.map((item) =>
        prisma.thriftItem.update({
          where: { id: item.id },
          data: {
            estimatedValue: item.estimatedValue != null ? toMoney(item.estimatedValue) : undefined,
            rejectionReason: item.approved === false ? (item.rejectionReason || null) : null,
            status: item.approved === false ? 'REJECTED' : 'APPROVED',
          },
        })
      )
    );
  }

  const updatedListing = await prisma.thriftListing.update({
    where: { id },
    data: {
      pickupDate: pickupDate ? new Date(pickupDate) : listing.pickupDate,
      pickupSlot: pickupSlot !== undefined ? pickupSlot : listing.pickupSlot,
      adminNotes: adminNotes !== undefined ? adminNotes : listing.adminNotes,
      contactRequested: false, // clear call request when admin responds
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: true,
    },
  });

  res.json({ success: true, data: updatedListing, message: 'Offer updated and resent to user' });
});

/**
 * PUT /api/admin/thrift/requests/:id/pickup
 * Mark listing + all approved items as PICKED_UP, then credit Fitverse Coins
 */
const markListingPickedUp = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const listing = await prisma.thriftListing.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!listing) throw new NotFoundError('Listing not found');
  if (listing.status !== 'APPROVED') {
    throw new BadRequestError('Listing must be APPROVED before marking picked up');
  }

  // Calculate coins from all items that have an estimatedValue (regardless of current item status)
  // The listing-level APPROVED→PICKED_UP guard ensures coins are only credited once
  const totalCoins = listing.items.reduce((sum, item) => {
    return sum + Math.round(parseFloat(item.estimatedValue || '0'));
  }, 0);

  // Update all APPROVED items to PICKED_UP
  await prisma.thriftItem.updateMany({
    where: { listingId: id, status: 'APPROVED' },
    data: { status: 'PICKED_UP' },
  });

  const updated = await prisma.$transaction(async (tx) => {
    const updatedListing = await tx.thriftListing.update({
      where: { id },
      data: { status: 'PICKED_UP' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });

    // Credit coins to user if any
    if (totalCoins > 0) {
      await tx.user.update({
        where: { id: listing.userId },
        data: { coinBalance: { increment: totalCoins } },
      });

      await tx.coinTransaction.create({
        data: {
          userId: listing.userId,
          amount: totalCoins,
          type: 'THRIFT_REWARD',
          description: `Reward for thrift pickup — ${listing.items.length} item(s) approved`,
          referenceId: id,
        },
      });
    }

    return updatedListing;
  });

  res.json({ success: true, data: updated, message: `Marked as picked up${totalCoins > 0 ? `. ${totalCoins} Fitverse Coins credited to user.` : ''}` });
});

/**
 * PUT /api/admin/thrift/items/:id/status
 * Update individual item status (PICKED_UP → UNDER_REFURBISHMENT → LISTED → SOLD)
 * Body: { status, adminNotes? }
 */
const updateThriftItemStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  const VALID_STATUSES = ['PICKED_UP', 'UNDER_REFURBISHMENT', 'REFURBISHMENT_COMPLETE', 'LISTED', 'SOLD'];
  if (!VALID_STATUSES.includes(status)) {
    throw new BadRequestError(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const item = await prisma.thriftItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Item not found');

  const updated = await prisma.thriftItem.update({
    where: { id },
    data: {
      status,
      adminNotes: adminNotes ?? item.adminNotes,
    },
  });

  res.json({ success: true, data: updated });
});

/**
 * POST /api/admin/thrift/items/:id/list
 * List a thrift item as a Product in the store
 * Body: { listedPrice, description?, stock? }
 */
const listThriftItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { listedPrice, description, stock = 1, condition } = req.body;

  const item = await prisma.thriftItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Item not found');

  const ELIGIBLE = ['PICKED_UP', 'UNDER_REFURBISHMENT'];
  if (!ELIGIBLE.includes(item.status)) {
    throw new BadRequestError('Item must be PICKED_UP or UNDER_REFURBISHMENT to list');
  }

  const finalPrice = toMoney(listedPrice) || toMoney(item.estimatedValue?.toString()) || 0;
  if (!finalPrice || finalPrice <= 0) {
    throw new BadRequestError('A valid listing price is required');
  }

  // Default availableSizes based on wearType
  const getDefaultSizes = (wearType) =>
    wearType === 'TOPWEAR'
      ? ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
      : ['28', '30', '32', '34', '36', '38', '40', '42'];

  // Create a real Product in the store
  const product = await prisma.product.create({
    data: {
      name: item.name,
      description: description || item.description,
      price: finalPrice,
      sizeStock: item.size ? { [item.size]: 1 } : {},
      availableSizes: item.size ? [item.size] : getDefaultSizes(item.wearType),
      brand: item.brand || null,
      gender: item.gender,
      wearType: item.wearType,
      category: item.category,
      subCategory: item.subCategory || null,
      isThrift: true,
      thriftCondition: condition || item.condition || null,
      images: item.images,
    },
  });

  // Update item to LISTED and link to the product
  const updatedItem = await prisma.thriftItem.update({
    where: { id },
    data: {
      status: 'LISTED',
      listedPrice: finalPrice,
      listedProductId: product.id,
    },
  });

  // Check if ALL non-rejected items in this listing are now listed/sold → COMPLETED
  const allItems = await prisma.thriftItem.findMany({ where: { listingId: item.listingId } });
  const active = allItems.filter((i) => i.status !== 'REJECTED');
  const done = active.filter((i) => ['LISTED', 'SOLD'].includes(i.status) || i.id === id);
  if (active.length > 0 && done.length >= active.length) {
    await prisma.thriftListing.update({
      where: { id: item.listingId },
      data: { status: 'COMPLETED' },
    });
  }

  res.json({ success: true, data: { item: updatedItem, product }, message: 'Item listed in store' });
});

/**
 * GET /api/admin/thrift/inventory
 * All thrift items that are LISTED or SOLD (visible in thrift store)
 */
const getThriftInventory = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const INVENTORY_STATUSES = ['PICKED_UP', 'UNDER_REFURBISHMENT', 'LISTED', 'SOLD'];
  const where = status && status !== 'ALL'
    ? { status }
    : { status: { in: INVENTORY_STATUSES } };

  const [items, total] = await Promise.all([
    prisma.thriftItem.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.thriftItem.count({ where }),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

/**
 * DELETE /api/admin/thrift/inventory/:id
 * Delete a thrift inventory item and any live product linked to it.
 */
const deleteThriftInventoryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const item = await prisma.thriftItem.findUnique({
    where: { id },
    select: {
      id: true,
      listingId: true,
      listedProductId: true,
      images: true,
    },
  });

  if (!item) throw new NotFoundError('Item not found');

  if (item.listedProductId) {
    await productService.deleteProduct(item.listedProductId);
    return res.json({ success: true, message: 'Thrift inventory item deleted successfully' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.thriftItem.delete({ where: { id } });
    await syncThriftListingStatus(tx, item.listingId);
  });

  await imageService.deleteMultiple(item.images || []);

  res.json({ success: true, message: 'Thrift inventory item deleted successfully' });
});

/**
 * GET /api/admin/refurbishment
 * All items in UNDER_REFURBISHMENT, REFURBISHMENT_COMPLETE, or LISTED state
 */
const getRefurbishmentItems = asyncHandler(async (req, res) => {
  const items = await prisma.thriftItem.findMany({
    where: {
      status: { in: ['UNDER_REFURBISHMENT', 'REFURBISHMENT_COMPLETE', 'LISTED'] },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const mapStatus = (s) =>
    s === 'UNDER_REFURBISHMENT' ? 'IN_PROGRESS'
    : s === 'REFURBISHMENT_COMPLETE' ? 'COMPLETED'
    : 'IN_INVENTORY';

  const mapped = items.map((item) => ({
    id: item.id,
    thriftRequestId: item.listingId,
    itemName: item.name,
    originalImages: item.images || [],
    refurbishedImages: [],
    notes: item.adminNotes || '',
    cost: item.refurbishmentCost ? parseFloat(item.refurbishmentCost.toString()) : 0,
    finalPrice: item.listedPrice ? parseFloat(item.listedPrice.toString()) : 0,
    status: mapStatus(item.status),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  res.json({ success: true, data: mapped });
});

/**
 * PUT /api/admin/refurbishment/:id
 * Update notes, cost, finalPrice, and optionally status (IN_PROGRESS / COMPLETED)
 */
const updateRefurbishmentItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes, cost, finalPrice, status } = req.body;

  const item = await prisma.thriftItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Refurbishment item not found');

  let dbStatus = item.status;
  if (status === 'COMPLETED') dbStatus = 'REFURBISHMENT_COMPLETE';
  else if (status === 'IN_PROGRESS') dbStatus = 'UNDER_REFURBISHMENT';

  const updated = await prisma.thriftItem.update({
    where: { id },
    data: {
      adminNotes: notes !== undefined ? notes : item.adminNotes,
      refurbishmentCost: cost != null ? toMoney(cost) : item.refurbishmentCost,
      listedPrice: finalPrice != null ? toMoney(finalPrice) : item.listedPrice,
      status: dbStatus,
    },
  });

  const mapStatus = (s) =>
    s === 'UNDER_REFURBISHMENT' ? 'IN_PROGRESS'
    : s === 'REFURBISHMENT_COMPLETE' ? 'COMPLETED'
    : 'IN_INVENTORY';

  res.json({
    success: true,
    data: {
      id: updated.id,
      thriftRequestId: updated.listingId,
      itemName: updated.name,
      originalImages: updated.images || [],
      refurbishedImages: [],
      notes: updated.adminNotes || '',
      cost: updated.refurbishmentCost ? parseFloat(updated.refurbishmentCost.toString()) : 0,
      finalPrice: updated.listedPrice ? parseFloat(updated.listedPrice.toString()) : 0,
      status: mapStatus(updated.status),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  });
});

/**
 * POST /api/admin/refurbishment/:id/move-to-inventory
 * Create a Product from the completed refurbishment item and mark it LISTED
 */
const moveRefurbishmentItemToInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const item = await prisma.thriftItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Item not found');

  if (item.status !== 'REFURBISHMENT_COMPLETE') {
    throw new BadRequestError('Item must be marked COMPLETED before moving to inventory');
  }

  const finalPrice = toMoney(item.listedPrice?.toString()) || 0;
  if (!finalPrice || finalPrice <= 0) {
    throw new BadRequestError('Set a final price before moving to inventory');
  }

  const getDefaultSizesR = (wearType) =>
    wearType === 'TOPWEAR'
      ? ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
      : ['28', '30', '32', '34', '36', '38', '40', '42'];

  const product = await prisma.product.create({
    data: {
      name: item.name,
      description: item.description,
      price: finalPrice,
      sizeStock: item.size ? { [item.size]: 1 } : {},
      availableSizes: item.size ? [item.size] : getDefaultSizesR(item.wearType),
      brand: item.brand || null,
      gender: item.gender,
      wearType: item.wearType,
      category: item.category,
      subCategory: item.subCategory || null,
      isThrift: true,
      images: item.images || [],
    },
  });

  await prisma.thriftItem.update({
    where: { id },
    data: { status: 'LISTED', listedProductId: product.id },
  });

  res.json({
    success: true,
    data: {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price.toString()),
      stock: product.stock,
      images: product.images,
      category: product.category,
      condition: 'GOOD',
      isSold: false,
      createdAt: product.createdAt,
    },
    message: 'Item moved to thrift inventory',
  });
});

/**
 * PUT /api/admin/users/:id/coins
 * Admin manually adds or deducts Fitverse Coins for a user
 * Body: { amount: number (positive=credit, negative=debit), description: string }
 */
const adjustUserCoins = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, description } = req.body;

  if (amount === 0 || amount == null || isNaN(parseInt(amount))) {
    throw new BadRequestError('Amount must be a non-zero integer');
  }
  if (!description || !description.trim()) {
    throw new BadRequestError('Description is required');
  }

  const parsedAmount = parseInt(amount);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');

  // Prevent balance going negative
  if (parsedAmount < 0 && user.coinBalance + parsedAmount < 0) {
    throw new BadRequestError(`Cannot deduct ${Math.abs(parsedAmount)} coins — user only has ${user.coinBalance}`);
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { coinBalance: { increment: parsedAmount } },
      select: { id: true, name: true, email: true, coinBalance: true },
    }),
    prisma.coinTransaction.create({
      data: {
        userId: id,
        amount: parsedAmount,
        type: 'ADMIN_ADJUSTMENT',
        description: description.trim(),
        referenceId: null,
      },
    }),
  ]);

  res.json({
    success: true,
    data: updatedUser,
    message: `${parsedAmount > 0 ? 'Credited' : 'Deducted'} ${Math.abs(parsedAmount)} Fitverse Coins`,
  });
});

/**
 * PUT /api/admin/users/:id/ai-credits
 * Admin manually adds or deducts AI credits for a user
 * Body: { amount: number }
 */
const adjustUserAiCredits = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (amount === 0 || amount == null || isNaN(parseInt(amount))) {
    throw new BadRequestError('Amount must be a non-zero integer');
  }

  const parsedAmount = parseInt(amount);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');

  if (parsedAmount < 0 && user.aiCredits + parsedAmount < 0) {
    throw new BadRequestError(`Cannot deduct ${Math.abs(parsedAmount)} credits — user only has ${user.aiCredits}`);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { aiCredits: { increment: parsedAmount } },
    select: { id: true, name: true, email: true, aiCredits: true },
  });

  res.json({
    success: true,
    data: updatedUser,
    message: `${parsedAmount > 0 ? 'Credited' : 'Deducted'} ${Math.abs(parsedAmount)} AI credits`,
  });
});

/**
 * DELETE /api/admin/users/:id
 * Permanently delete a user and all related records + uploaded images.
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) throw new NotFoundError('User not found');
  if (user.role === 'ADMIN') {
    throw new BadRequestError('Admin accounts cannot be deleted from this endpoint');
  }

  const [userThriftItems, userReturnRequests, userReviews] = await Promise.all([
    prisma.thriftItem.findMany({
      where: { userId: id },
      select: { images: true, listedProductId: true },
    }),
    prisma.returnRequest.findMany({
      where: { userId: id },
      select: { images: true },
    }),
    prisma.review.findMany({
      where: { userId: id },
      select: { images: true },
    }),
  ]);

  const linkedProductIds = [...new Set(
    userThriftItems.map((item) => item.listedProductId).filter(Boolean)
  )];

  const linkedProducts = linkedProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: linkedProductIds } },
        select: { id: true, images: true },
      })
    : [];

  const imagesToDelete = [
    ...userThriftItems.flatMap((item) => item.images || []),
    ...linkedProducts.flatMap((product) => product.images || []),
    ...userReturnRequests.flatMap((request) => request.images || []),
    ...userReviews.flatMap((review) => review.images || []),
  ];

  await prisma.$transaction(async (tx) => {
    if (linkedProductIds.length) {
      await tx.couponProduct.deleteMany({ where: { productId: { in: linkedProductIds } } });
      await tx.cartItem.deleteMany({ where: { productId: { in: linkedProductIds } } });
      await tx.review.deleteMany({ where: { productId: { in: linkedProductIds } } });
      await tx.product.deleteMany({ where: { id: { in: linkedProductIds } } });
    }

    await tx.couponUsage.deleteMany({ where: { userId: id } });
    await tx.couponBlockedUser.deleteMany({ where: { userId: id } });
    await tx.coinTransaction.deleteMany({ where: { userId: id } });
    await tx.reviewHelpful.deleteMany({ where: { userId: id } });
    await tx.review.deleteMany({ where: { userId: id } });

    await tx.returnRequestItem.deleteMany({ where: { returnRequest: { userId: id } } });
    await tx.returnRequest.deleteMany({ where: { userId: id } });

    await tx.orderItem.deleteMany({ where: { order: { userId: id } } });
    await tx.order.deleteMany({ where: { userId: id } });

    await tx.cartItem.deleteMany({ where: { cart: { userId: id } } });
    await tx.cart.deleteMany({ where: { userId: id } });

    await tx.thriftItem.deleteMany({ where: { userId: id } });
    await tx.thriftListing.deleteMany({ where: { userId: id } });

    await tx.address.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
  });

  await imageService.deleteMultiple([...new Set(imagesToDelete)]);

  res.json({
    success: true,
    message: 'User and all related data deleted successfully',
  });
});

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  getUserOrders,
  getAiUsageSummary,
  blockUser,
  unblockUser,
  getAllOrders,
  // Coins
  adjustUserCoins,
  adjustUserAiCredits,
  deleteUser,
  // Thrift
  getAllThriftListings,
  getThriftListingById,
  reviewThriftListing,
  updateThriftOffer,
  markListingPickedUp,
  updateThriftItemStatus,
  listThriftItem,
  getThriftInventory,
  deleteThriftInventoryItem,
  // Refurbishment
  getRefurbishmentItems,
  updateRefurbishmentItem,
  moveRefurbishmentItemToInventory,
};
