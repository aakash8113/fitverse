// Admin Controller
// Production admin endpoints: stats, users, and order management

const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/database');
const { NotFoundError } = require('../utils/errors');

// ============================================
// DASHBOARD STATS
// ============================================

/**
 * GET /api/admin/stats
 * Returns aggregated dashboard statistics
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalProducts, totalOrders, orders] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.product.count(),
    prisma.order.count(),
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
      thriftRequestCount: 0, // Pending thrift feature
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

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  getUserOrders,
  blockUser,
  unblockUser,
  getAllOrders,
};
