// Order Service
// Business logic for order management with payment processing

const prisma = require('../config/database');
const paymentService = require('./paymentService');
const cartService = require('./cartService');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { generateOrderNumber } = require('../utils/helpers');
const logger = require('../config/logger');

class OrderService {
  /**
   * Create order from cart
   * @param {String} userId - User ID
   * @param {Object} orderData - {addressId, paymentMethod}
   * @returns {Promise<Object>} Created order
   */
  async createOrder(userId, orderData) {
    const { addressId, paymentMethod } = orderData;

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

    // Validate stock for all items before proceeding
    for (const item of cart.items) {
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
    const subtotal = cart.items.reduce((sum, item) => {
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
      for (const item of cart.items) {
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

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    logger.info(`Order created: ${orderNumber} for user ${userId}`);

    // Return order with full details
    return await this.getOrderById(userId, order.id);
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

    return orders;
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

    return order;
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
}

module.exports = new OrderService();
