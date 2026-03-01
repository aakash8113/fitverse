// Order Service
// Business logic for order management with payment processing

const prisma = require('../config/database');
const paymentService = require('./paymentService');
const cartService = require('./cartService');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { generateOrderNumber } = require('../utils/helpers');
const logger = require('../config/logger');
const emailService = require('./emailService');

class OrderService {
  /**
   * Create order from cart
   * @param {String} userId - User ID
   * @param {Object} orderData - {addressId, paymentMethod}
   * @returns {Promise<Object>} Created order
   */
  async createOrder(userId, orderData) {
    const { addressId, paymentMethod, productIds } = orderData;

    // Verify address exists and belongs to user
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundError('Address not found');
    }

    if (address.userId !== userId) {
      throw new BadRequestError('Unauthorized access to address');
    }

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    // If productIds provided (buy-now flow), only order those items
    const itemsToOrder = productIds?.length
      ? cart.items.filter((item) => productIds.includes(item.productId))
      : cart.items;

    if (itemsToOrder.length === 0) {
      throw new BadRequestError('No matching items found in cart');
    }

    // Validate stock for items being ordered
    for (const item of itemsToOrder) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for ${item.product.name}. Only ${item.product.stock} available.`
        );
      }

      if (!item.product.isActive) {
        throw new BadRequestError(`${item.product.name} is no longer available`);
      }
    }

    // Calculate order totals (NEVER trust frontend calculations)
    const subtotal = itemsToOrder.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0);

    const shipping = 15.00; // Fixed shipping cost
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const total = subtotal + shipping + tax;

    // Generate unique order number
    const orderNumber = generateOrderNumber();

    // Process payment
    let paymentResult;
    let paymentId = null;
    let paymentStatus = 'PENDING';

    try {
      if (paymentMethod === 'COD') {
        paymentResult = await paymentService.processCOD({
          amount: total,
          orderNumber,
        });
        paymentId = paymentResult.paymentId;
        paymentStatus = 'COD_PENDING';
      } else {
        // Create payment intent
        paymentResult = await paymentService.createPaymentIntent({
          amount: total,
          currency: 'usd',
          metadata: {
            userId,
            orderNumber,
          },
        });
        paymentId = paymentResult.paymentId;

        // Verify payment (in production, this would be a webhook)
        const verification = await paymentService.verifyPayment(paymentId);
        
        if (!verification.success) {
          throw new BadRequestError('Payment failed. Please try again.');
        }

        paymentStatus = 'COMPLETED';
      }
    } catch (error) {
      logger.error(`Payment processing failed: ${error.message}`);
      throw new BadRequestError('Payment processing failed. Please try again.');
    }

    // Create order with transaction to ensure atomicity
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          paymentMethod,
          paymentStatus,
          paymentId,
          subtotal,
          shipping,
          tax,
          total,
          status: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        },
      });

      // Create order items and reduce stock
      for (const item of itemsToOrder) {
        // Create order item (snapshot of product at time of order)
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            productName: item.product.name,
            productImage: item.product.images[0] || '',
            price: item.product.price,
            quantity: item.quantity,
          },
        });

        // Reduce product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Only remove ordered items from cart (supports buy-now partial checkout)
      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId: { in: itemsToOrder.map((i) => i.productId) },
        },
      });

      return newOrder;
    });

    logger.info(`Order created: ${orderNumber} for user ${userId}`);

    // Return order with full details
    const fullOrder = await this.getOrderById(userId, order.id);

    // Fire-and-forget confirmation email (never fails the order response)
    prisma.user
      .findUnique({ where: { id: userId }, select: { name: true, email: true } })
      .then((user) => {
        if (user?.email) {
          emailService
            .sendOrderConfirmationEmail(user.email, user.name, fullOrder)
            .catch((err) => logger.error(`Order confirmation email failed: ${err.message}`));
        }
      })
      .catch((err) => logger.error(`User fetch for order email failed: ${err.message}`));

    return fullOrder;
  }

  /**
   * Get user's orders
   * @param {String} userId - User ID
   * @param {Object} query - Query parameters
   * @returns {Promise<Array>} List of orders
   */
  async getOrders(userId, query = {}) {
    const where = {
      userId,
    };

    // Filter by status
    if (query.status) {
      where.status = query.status.toUpperCase();
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        address: true,
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map(order => {
      const { orderItems, ...rest } = order;
      return { ...rest, items: orderItems };
    });
  }

  /**
   * Get single order by ID
   * @param {String} userId - User ID
   * @param {String} orderId - Order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrderById(userId, orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        address: true,
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestError('Unauthorized access to order');
    }

    const { orderItems, ...rest } = order;
    return { ...rest, items: orderItems };
  }

  /**
   * Cancel order
   * @param {String} userId - User ID
   * @param {String} orderId - Order ID
   * @returns {Promise<Object>} Updated order
   */
  async cancelOrder(userId, orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestError('Unauthorized access to order');
    }

    // Can only cancel pending or paid orders (not shipped/delivered)
    if (!['PENDING', 'PAID'].includes(order.status)) {
      throw new BadRequestError('Cannot cancel order at this stage');
    }

    // Update order status and restore stock
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      // Restore product stock
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    });

    // Process refund if payment was completed
    if (order.paymentStatus === 'COMPLETED') {
      await paymentService.processRefund(order.paymentId, parseFloat(order.total));
    }

    logger.info(`Order cancelled: ${orderId}`);

    return await this.getOrderById(userId, orderId);
  }

  /**
   * Update order status (ADMIN only)
   * @param {String} orderId - Order ID
   * @param {String} status - New status
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, status) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const updateData = {
      status,
    };

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    logger.info(`Order status updated: ${orderId} -> ${status}`);

    return updatedOrder;
  }

  /**
   * Get all orders (ADMIN only)
   * @param {Object} query - Query parameters
   * @returns {Promise<Array>} List of all orders
   */
  async getAllOrders(query = {}) {
    const where = {};

    if (query.status) {
      where.status = query.status.toUpperCase();
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        address: true,
        orderItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders;
  }

  /**
   * Track order publicly by order number + email
   * @param {String} orderNumber - Order number
   * @param {String} email - User email (lowercase)
   * @returns {Promise<Object>} Order tracking info
   */
  async trackOrder(orderNumber, email) {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        user: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
      },
      include: {
        orderItems: true,
        address: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found. Please check your order number and email address.');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
      address: order.address,
      items: order.orderItems,
    };
  }
}

module.exports = new OrderService();
