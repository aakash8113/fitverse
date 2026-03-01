// Admin Controller
// Production admin endpoints: stats, users, and order management

// Round a value to 2 decimal places — avoids floating point drift (e.g. 200 → 199.97)
const toMoney = (val) => val != null && val !== '' ? Math.round(parseFloat(val) * 100) / 100 : null;

const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');

// ============================================
// DASHBOARD STATS
// ============================================

/**
 * GET /api/admin/stats
 * Returns aggregated dashboard statistics
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalProducts, totalOrders, totalThriftListings, orders] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.product.count(),
    prisma.order.count(),
    prisma.thriftListing.count(),
    prisma.order.findMany({
      select: { total: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  // Monthly revenue for current year
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const ordersByMonth = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfYear },
      status: { notIn: ['CANCELLED'] },
    },
    select: { total: true, createdAt: true },
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueByMonth = monthNames.map((month, i) => ({
    month,
    revenue: ordersByMonth
      .filter((o) => new Date(o.createdAt).getMonth() === i)
      .reduce((sum, o) => sum + parseFloat(o.total?.toString() || '0'), 0),
  }));

  const monthlyRevenue = revenueByMonth[now.getMonth()].revenue;

  // Recent orders
  const recentOrders = await prisma.order.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      orderItems: { take: 1 },
    },
  });

  res.json({
    success: true,
    data: {
      totalUsers,
      totalProducts,
      totalOrders,
      monthlyRevenue,
      thriftRequestCount: totalThriftListings,
      aiTryOnCount: 0,       // Pending AI feature
      revenueByMonth,
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

  res.json({
    success: true,
    data: orders,
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
 * Admin reviews a listing: approves/rejects items, sets pickup date + estimated values
 * Body: {
 *   decision: 'APPROVED' | 'REJECTED',
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

  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    throw new BadRequestError('Decision must be APPROVED or REJECTED');
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

  const updatedListing = await prisma.thriftListing.update({
    where: { id },
    data: {
      status: decision,
      pickupDate: decision === 'APPROVED' && pickupDate ? new Date(pickupDate) : null,
      pickupSlot: pickupSlot || null,
      adminNotes: adminNotes || null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: true,
    },
  });

  res.json({ success: true, data: updatedListing, message: `Listing ${decision.toLowerCase()} successfully` });
});

/**
 * PUT /api/admin/thrift/requests/:id/pickup
 * Mark listing + all approved items as PICKED_UP
 */
const markListingPickedUp = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const listing = await prisma.thriftListing.findUnique({ where: { id } });
  if (!listing) throw new NotFoundError('Listing not found');
  if (listing.status !== 'APPROVED') {
    throw new BadRequestError('Listing must be APPROVED before marking picked up');
  }

  // Update all APPROVED items to PICKED_UP
  await prisma.thriftItem.updateMany({
    where: { listingId: id, status: 'APPROVED' },
    data: { status: 'PICKED_UP' },
  });

  const updated = await prisma.thriftListing.update({
    where: { id },
    data: { status: 'PICKED_UP' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: true,
    },
  });

  res.json({ success: true, data: updated, message: 'Marked as picked up' });
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
  const { listedPrice, description, stock = 1 } = req.body;

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
      stock: parseInt(stock) || 1,
      brand: item.brand || null,
      gender: item.gender,
      wearType: item.wearType,
      category: item.category,
      subCategory: item.subCategory || null,
      availableSizes: getDefaultSizes(item.wearType),
      isThrift: true,
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
      stock: 1,
      brand: item.brand || null,
      gender: item.gender,
      wearType: item.wearType,
      category: item.category,
      subCategory: item.subCategory || null,
      availableSizes: getDefaultSizesR(item.wearType),
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

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  getUserOrders,
  blockUser,
  unblockUser,
  getAllOrders,
  // Thrift
  getAllThriftListings,
  getThriftListingById,
  reviewThriftListing,
  markListingPickedUp,
  updateThriftItemStatus,
  listThriftItem,
  getThriftInventory,
  // Refurbishment
  getRefurbishmentItems,
  updateRefurbishmentItem,
  moveRefurbishmentItemToInventory,
};
