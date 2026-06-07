// Seller Service
// Business logic for seller operations — works only with products owned by the seller

const prisma = require('../config/database');
const imageService = require('./imageService');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const logger = require('../config/logger');

class SellerService {
  /**
   * Get dashboard stats for a seller
   */
  async getSellerStats(sellerId) {
    const sellerProductIds = await this._getSellerProductIds(sellerId);

    const [totalProducts, totalOrders, totalRevenue, recentOrders] = await Promise.all([
      prisma.product.count({
        where: { sellerId, isActive: true, isThrift: false },
      }),
      sellerProductIds.length > 0
        ? prisma.orderItem.groupBy({
            by: ['orderId'],
            where: { productId: { in: sellerProductIds } },
            _count: { _all: true },
          }).then((rows) => rows.length)
        : 0,
      sellerProductIds.length > 0
        ? prisma.orderItem.aggregate({
            where: {
              productId: { in: sellerProductIds },
              order: { status: 'DELIVERED' },
            },
            _sum: { price: true },
          }).then((r) => parseFloat(r._sum.price?.toString() || '0'))
        : 0,
      sellerProductIds.length > 0
        ? prisma.orderItem.findMany({
            where: { productId: { in: sellerProductIds } },
            include: {
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  status: true,
                  createdAt: true,
                  user: { select: { name: true, email: true } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 8,
            distinct: ['orderId'],
          }).then((items) => {
            const seen = new Set();
            return items.filter((i) => {
              if (seen.has(i.orderId)) return false;
              seen.add(i.orderId);
              return true;
            }).map((i) => i.order);
          })
        : [],
    ]);

    return {
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
    };
  }

  /**
   * Get seller's own products with pagination & filters
   */
  async getSellerProducts(sellerId, query = {}) {
    const { page = 1, limit = 20, search, gender, category, sortBy } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      sellerId,
      isThrift: false,
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (gender) where.gender = gender.toUpperCase();
    if (category) where.category = category.toUpperCase();

    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price-low') orderBy = { price: 'asc' };
    else if (sortBy === 'price-high') orderBy = { price: 'desc' };
    else if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sortBy === 'name') orderBy = { name: 'asc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: parseInt(limit), orderBy }),
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
   * Create product as a seller
   */
  async createSellerProduct(sellerId, productData, images = []) {
    let imagePaths = [];
    if (images && images.length > 0) {
      imagePaths = await imageService.uploadMultiple(images, 'products');
    }

    let availableSizes = productData.availableSizes || [];
    if (typeof availableSizes === 'string') {
      try { availableSizes = JSON.parse(availableSizes); } catch { availableSizes = []; }
    }
    if (!Array.isArray(availableSizes)) availableSizes = [];

    let sizeStock = productData.sizeStock || {};
    if (typeof sizeStock === 'string') {
      try { sizeStock = JSON.parse(sizeStock); } catch { sizeStock = {}; }
    }
    sizeStock = Object.fromEntries(
      Object.entries(sizeStock).map(([k, v]) => [k, parseInt(v, 10) || 0])
    );

    const product = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        price: Math.round(parseFloat(productData.price) * 100) / 100,
        sizeStock,
        brand: productData.brand || null,
        gender: productData.gender,
        wearType: productData.wearType,
        category: productData.category,
        subCategory: productData.subCategory || null,
        availableSizes,
        isThrift: false,
        images: imagePaths,
        sellerId,
      },
    });

    logger.info(`Seller product created: ${product.id} by seller ${sellerId}`);
    return product;
  }

  /**
   * Update a seller's own product
   */
  async updateSellerProduct(sellerId, productId, updateData, newImages = []) {
    const product = await this._getOwnedProduct(sellerId, productId);

    if (updateData.price) {
      updateData.price = parseFloat(updateData.price);
    }
    delete updateData.stock;
    delete updateData.sellerId; // Cannot reassign seller
    delete updateData.isThrift;

    if (updateData.sizeStock !== undefined) {
      if (typeof updateData.sizeStock === 'string') {
        try { updateData.sizeStock = JSON.parse(updateData.sizeStock); } catch { updateData.sizeStock = {}; }
      }
      updateData.sizeStock = Object.fromEntries(
        Object.entries(updateData.sizeStock).map(([k, v]) => [k, parseInt(v, 10) || 0])
      );
    }

    if (updateData.availableSizes !== undefined) {
      let sizes = updateData.availableSizes;
      if (typeof sizes === 'string') {
        try { sizes = JSON.parse(sizes); } catch { sizes = []; }
      }
      if (!Array.isArray(sizes)) sizes = [];
      updateData.availableSizes = sizes;
    }

    if (updateData.subCategory === '' || updateData.subCategory === 'null') {
      updateData.subCategory = null;
    }

    if (newImages && newImages.length > 0) {
      const newImagePaths = await imageService.uploadMultiple(newImages, 'products');
      updateData.images = [...product.images, ...newImagePaths];
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    logger.info(`Seller product updated: ${productId} by seller ${sellerId}`);
    return updated;
  }

  /**
   * Delete a seller's own product (soft delete)
   */
  async deleteSellerProduct(sellerId, productId) {
    await this._getOwnedProduct(sellerId, productId);

    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    logger.info(`Seller product soft-deleted: ${productId} by seller ${sellerId}`);
    return { message: 'Product removed successfully' };
  }

  /**
   * Delete an image from seller's product
   */
  async deleteSellerProductImage(sellerId, productId, imagePath) {
    const product = await this._getOwnedProduct(sellerId, productId);

    if (!product.images.includes(imagePath)) {
      throw new BadRequestError('Image not found in product');
    }

    const updatedImages = product.images.filter((img) => img !== imagePath);
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { images: updatedImages },
    });

    await imageService.delete(imagePath);

    logger.info(`Seller product image deleted: ${productId} by seller ${sellerId}`);
    return updated;
  }

  /**
   * Get revenue/analytics for seller's products
   */
  async getSellerRevenue(sellerId) {
    const sellerProductIds = await this._getSellerProductIds(sellerId);

    if (sellerProductIds.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        revenueByMonth: [],
        revenueByProduct: [],
        revenueByCategory: [],
      };
    }

    // Get completed order items for seller's products
    const orderItems = await prisma.orderItem.findMany({
      where: {
        productId: { in: sellerProductIds },
        order: { status: 'DELIVERED' },
      },
      include: {
        order: { select: { createdAt: true, orderNumber: true } },
        product: { select: { name: true, category: true } },
      },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    // Revenue by month
    const revenueByMonth = monthNames.map((month, i) => ({
      month,
      revenue: orderItems
        .filter((oi) => new Date(oi.order.createdAt).getMonth() === i && new Date(oi.order.createdAt).getFullYear() === now.getFullYear())
        .reduce((sum, oi) => sum + parseFloat(oi.price.toString()) * oi.quantity, 0),
    }));

    // Revenue by product
    const productMap = new Map();
    orderItems.forEach((oi) => {
      const pid = oi.productId;
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          productId: pid,
          productName: oi.product.name,
          quantity: 0,
          revenue: 0,
        });
      }
      const entry = productMap.get(pid);
      entry.quantity += oi.quantity;
      entry.revenue += parseFloat(oi.price.toString()) * oi.quantity;
    });
    const revenueByProduct = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);

    // Revenue by category
    const categoryMap = new Map();
    orderItems.forEach((oi) => {
      const cat = oi.product.category;
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { category: cat, count: 0, revenue: 0 });
      }
      const entry = categoryMap.get(cat);
      entry.count += oi.quantity;
      entry.revenue += parseFloat(oi.price.toString()) * oi.quantity;
    });
    const revenueByCategory = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = orderItems.reduce((sum, oi) => sum + parseFloat(oi.price.toString()) * oi.quantity, 0);

    return {
      totalRevenue,
      totalOrders: orderItems.length,
      revenueByMonth,
      revenueByProduct,
      revenueByCategory,
    };
  }

  /**
   * Get orders containing seller's products
   */
  async getSellerOrders(sellerId, query = {}) {
    const { page = 1, limit = 20, status } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sellerProductIds = await this._getSellerProductIds(sellerId);

    if (sellerProductIds.length === 0) {
      return { orders: [], pagination: { currentPage: 1, itemsPerPage: parseInt(limit), totalItems: 0, totalPages: 0 } };
    }

    const where = {
      productId: { in: sellerProductIds },
      ...(status ? { order: { status } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.orderItem.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              shippedAt: true,
              deliveredAt: true,
              paymentMethod: true,
              paymentStatus: true,
              total: true,
              shipping: true,
              user: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
          product: { select: { id: true, name: true, images: true, sellerId: true } },
        },
      }),
      prisma.orderItem.count({ where }),
    ]);

    // Group items by order
    const orderMap = new Map();
    items.forEach((item) => {
      if (!orderMap.has(item.orderId)) {
        orderMap.set(item.orderId, {
          ...item.order,
          sellerItems: [],
        });
      }
      orderMap.get(item.orderId).sellerItems.push({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        price: parseFloat(item.price.toString()),
        quantity: item.quantity,
        size: item.size,
        product: item.product,
      });
    });

    const orders = Array.from(orderMap.values());

    return {
      orders,
      pagination: {
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
        totalItems: total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Mark an order item as shipped by the seller
   * Seller can mark SHIPPED status on orders containing their products
   */
  async markOrderItemShipped(sellerId, orderId) {
    const sellerProductIds = await this._getSellerProductIds(sellerId);

    // Verify seller has products in this order
    const sellerItemsInOrder = await prisma.orderItem.findMany({
      where: {
        orderId,
        productId: { in: sellerProductIds },
      },
    });

    if (sellerItemsInOrder.length === 0) {
      throw new ForbiddenError('You do not have any products in this order');
    }

    // Update the order status to SHIPPED if currently PROCESSING
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order not found');
    if (order.status !== 'PROCESSING') {
      throw new BadRequestError(`Cannot ship order with status: ${order.status}`);
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        shippedAt: new Date(),
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        shippedAt: true,
      },
    });

    logger.info(`Seller ${sellerId} marked order ${orderId} as shipped`);
    return updated;
  }

  // ── Private helpers ──────────────────────────────────────────

  /** Get all product IDs owned by this seller */
  async _getSellerProductIds(sellerId) {
    const products = await prisma.product.findMany({
      where: { sellerId, isActive: true, isThrift: false },
      select: { id: true },
    });
    return products.map((p) => p.id);
  }

  /** Get a product and verify it belongs to this seller (throws if not) */
  async _getOwnedProduct(sellerId, productId) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError('Product not found');
    if (product.sellerId !== sellerId) {
      throw new ForbiddenError('You do not own this product');
    }
    return product;
  }
}

module.exports = new SellerService();