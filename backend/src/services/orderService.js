// Order Service
// Business logic for order management with payment processing

const prisma = require('../config/database');
const paymentService = require('./paymentService');
const cartService = require('./cartService');
const couponService = require('./couponService');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { generateOrderNumber } = require('../utils/helpers');
const logger = require('../config/logger');
const emailService = require('./emailService');
const { isSchemaMismatchError } = require('../utils/dbErrors');

class OrderService {
  /**
   * Create order from cart (for COD and COINS-only payments)
   * @param {String} userId - User ID
   * @param {Object} orderData - {addressId, paymentMethod}
   * @returns {Promise<Object>} Created order
   */
  async createOrder(userId, orderData) {
    const { addressId, paymentMethod, productIds, coinsToUse: rawCoinsToUse, couponCode } = orderData;

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

    // Validate per-size stock for items being ordered
    for (const item of itemsToOrder) {
      const sizeAvail = (item.product.sizeStock || {})[item.size || ''] ?? 0;
      if (sizeAvail < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for ${item.product.name} in size ${item.size || 'selected'}. Only ${sizeAvail} available.`
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

    const shipping = 0; // FREE shipping — costs included in product prices
    const tax = 0; // Prices are inclusive of tax

    // Coupon discount (validated server-side — never trust frontend amount)
    let couponDiscount = 0;
    let validatedCoupon = null;
    if (couponCode) {
      const couponResult = await couponService.validateCoupon(userId, couponCode, itemsToOrder);
      couponDiscount = couponResult.discountAmount;
      validatedCoupon = couponResult.coupon;
    }

    // Fitverse Coins discount (applied on top of coupon discount)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { coinBalance: true } });
    const afterCoupon = Math.max(0, subtotal + shipping - couponDiscount);
    const maxCoins = Math.ceil(afterCoupon);
    const coinsToUse = Math.min(Math.max(0, parseInt(rawCoinsToUse || 0)), user.coinBalance, maxCoins);
    const total = Math.max(0, afterCoupon - coinsToUse);
    const effectivePaymentMethod = total === 0 ? 'COINS' : paymentMethod;

    // Generate unique order number
    const orderNumber = generateOrderNumber();

    // Process payment
    let paymentResult;
    let paymentId = null;
    let paymentStatus = 'PENDING';

    try {
      if (paymentMethod === 'COD' || effectivePaymentMethod === 'COINS') {
        paymentResult = await paymentService.processCOD({
          amount: total,
          orderNumber,
        });
        paymentId = paymentResult.paymentId;
        paymentStatus = total === 0 ? 'COMPLETED' : 'COD_PENDING';
      }
    } catch (error) {
      logger.error(`Payment processing failed: ${error.message}`);
      throw new BadRequestError('Payment processing failed. Please try again.');
    }

    // Create order with transaction to ensure atomicity
    const order = await this._createOrderInDb({
      userId,
      orderNumber,
      addressId,
      paymentMethod: effectivePaymentMethod,
      paymentStatus,
      paymentId,
      subtotal,
      shipping,
      tax,
      total,
      coinsToUse,
      validatedCoupon,
      couponDiscount,
      itemsToOrder,
      cart,
    });

    logger.info(`Order created: ${orderNumber} for user ${userId}`);

    // Return order with full details
    const fullOrder = await this.getOrderById(userId, order.id);

    // Fire-and-forget confirmation email
    this._sendConfirmationEmail(userId, fullOrder);

    return fullOrder;
  }

  /**
   * Validate cart and create a Razorpay order (NO DB order created).
   * Returns razorpayOrderId + receipt for frontend to open checkout.
   * @param {String} userId
   * @param {Object} orderData
   * @returns {Promise<{razorpayOrderId: string, receipt: string, amount: number, cartInfo: Object}>}
   */
  async initiatePrepaidOrder(userId, orderData) {
    const { addressId, paymentMethod, productIds, coinsToUse: rawCoinsToUse, couponCode } = orderData;

    // Verify address
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address) throw new NotFoundError('Address not found');
    if (address.userId !== userId) throw new BadRequestError('Unauthorized access to address');

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) throw new BadRequestError('Cart is empty');

    const itemsToOrder = productIds?.length
      ? cart.items.filter((item) => productIds.includes(item.productId))
      : cart.items;
    if (itemsToOrder.length === 0) throw new BadRequestError('No matching items found in cart');

    // Validate stock
    for (const item of itemsToOrder) {
      const avail = (item.product.sizeStock || {})[item.size || ''] ?? 0;
      if (avail < item.quantity)
        throw new BadRequestError(`Insufficient stock for ${item.product.name}`);
      if (!item.product.isActive)
        throw new BadRequestError(`${item.product.name} is no longer available`);
    }

    // Calculate totals
    const subtotal = itemsToOrder.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
    const shipping = 0;
    const tax = 0;

    // Coupon
    let couponDiscount = 0;
    let validatedCoupon = null;
    if (couponCode) {
      const couponResult = await couponService.validateCoupon(userId, couponCode, itemsToOrder);
      couponDiscount = couponResult.discountAmount;
      validatedCoupon = couponResult.coupon;
    }

    // Coins
    const userForCoins = await prisma.user.findUnique({ where: { id: userId }, select: { coinBalance: true } });
    const afterCouponP = Math.max(0, subtotal + shipping - couponDiscount);
    const maxCoinsP = Math.ceil(afterCouponP);
    const coinsToUse = Math.min(Math.max(0, parseInt(rawCoinsToUse || 0)), userForCoins.coinBalance, maxCoinsP);
    const total = Math.max(0, afterCouponP - coinsToUse);
    const effectivePaymentMethod = total === 0 ? 'COINS' : paymentMethod;

    if (total === 0) {
      // Coins cover entire amount — create order directly
      const orderNumber = generateOrderNumber();
      const paymentResult = await paymentService.processCOD({ amount: 0, orderNumber });
      return this._createOrderInDb({
        userId, orderNumber, addressId,
        paymentMethod: 'COINS', paymentStatus: 'COMPLETED',
        paymentId: paymentResult.paymentId,
        subtotal, shipping, tax, total: 0,
        coinsToUse, validatedCoupon, couponDiscount,
        itemsToOrder, cart,
      });
    }

    // Generate receipt for Razorpay
    const receipt = generateOrderNumber();

    // Create Razorpay order
    const razorpayOrder = await paymentService.createOrder({
      merchantOrderId: receipt,
      amountInPaise: Math.round(parseFloat(total) * 100),
      notes: {
        userId,
        receipt,
        addressId,
        paymentMethod: effectivePaymentMethod,
        productIds: productIds ? JSON.stringify(productIds) : '',
        coinsToUse: String(coinsToUse),
        couponCode: couponCode || '',
        subtotal: String(subtotal),
        couponDiscount: String(couponDiscount),
      },
    });

    logger.info(`Prepaid order initiated: receipt=${receipt} razorpayOrderId=${razorpayOrder.id} for user ${userId}`);

    // Return only the Razorpay order info — NO DB order yet
    return {
      razorpayOrderId: razorpayOrder.id,
      receipt,
      amount: total,
      subtotal,
      shipping,
      tax,
      couponDiscount,
      coinsToUse,
      paymentMethod: effectivePaymentMethod,
      addressId,
      productIds: productIds || null,
      couponCode: couponCode || null,
      validatedCoupon: validatedCoupon || null,
      itemsToOrder,
      cart,
    };
  }

  /**
   * Create the DB order after successful Razorpay payment verification.
   * This is called from /api/payment/verify after signature is validated.
   * @param {String} userId
   * @param {Object} data - All the info returned by initiatePrepaidOrder
   * @param {String} razorpayPaymentId
   * @returns {Promise<Object>} Created order
   */
  async createPaidOrder(userId, data, razorpayPaymentId) {
    const {
      receipt: orderNumber,
      addressId,
      paymentMethod,
      subtotal,
      shipping,
      tax,
      amount: total,
      coinsToUse,
      couponCode,
      couponDiscount,
      validatedCoupon,
      itemsToOrder,
      cart,
    } = data;

    const order = await this._createOrderInDb({
      userId,
      orderNumber,
      addressId,
      paymentMethod,
      paymentStatus: 'COMPLETED',
      paymentId: razorpayPaymentId,
      subtotal,
      shipping,
      tax,
      total,
      coinsToUse,
      validatedCoupon,
      couponDiscount,
      itemsToOrder,
      cart,
    });

    logger.info(`Paid order created: ${orderNumber} for user ${userId}`);

    const fullOrder = await this.getOrderById(userId, order.id);
    this._sendConfirmationEmail(userId, fullOrder);
    return fullOrder;
  }

  /**
   * Internal helper — creates order, order items, reduces stock, clears cart, deducts coins, records coupon.
   */
  async _createOrderInDb({ userId, orderNumber, addressId, paymentMethod, paymentStatus, paymentId, subtotal, shipping, tax, total, coinsToUse, validatedCoupon, couponDiscount, itemsToOrder, cart }) {
    return prisma.$transaction(async (tx) => {
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
          coinsUsed: coinsToUse || 0,
          couponId: validatedCoupon?.id || null,
          couponCode: validatedCoupon?.code || null,
          couponDiscount: couponDiscount || 0,
          status: 'PROCESSING',
        },
      });

      // Create order items and reduce stock
      for (const item of itemsToOrder) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            productName: item.product.name,
            productImage: item.product.images[0] || '',
            price: item.product.price,
            quantity: item.quantity,
            size: item.size || '',
          },
        });

        // Reduce per-size stock
        const curProduct = await tx.product.findUnique({ where: { id: item.productId }, select: { sizeStock: true } });
        const newSizeStock = { ...(curProduct.sizeStock || {}) };
        const sk = item.size || '';
        newSizeStock[sk] = Math.max(0, (newSizeStock[sk] || 0) - item.quantity);
        await tx.product.update({ where: { id: item.productId }, data: { sizeStock: newSizeStock } });
      }

      // Remove ordered items from cart
      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId: { in: itemsToOrder.map((i) => i.productId) },
        },
      });

      // Deduct coins
      if (coinsToUse > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { coinBalance: { decrement: coinsToUse } },
        });
        await tx.coinTransaction.create({
          data: {
            userId,
            amount: -coinsToUse,
            type: 'ORDER_PAYMENT',
            description: `Coins used for order ${orderNumber}`,
            referenceId: newOrder.id,
          },
        });
      }

      // Record coupon usage
      if (validatedCoupon) {
        await couponService.applyCoupon(tx, validatedCoupon.id, newOrder.id, userId);
      }

      return newOrder;
    });
  }

  /**
   * Send confirmation email (fire-and-forget)
   */
  _sendConfirmationEmail(userId, fullOrder) {
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
  }

  /**
   * Get user's orders
   */
  async getOrders(userId, query = {}) {
    const where = { userId };

    const VALID_ORDER_STATUSES = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    if (query.status) {
      const s = query.status.toUpperCase();
      if (VALID_ORDER_STATUSES.includes(s)) {
        where.status = s;
      }
    }

    let orders;
    try {
      orders = await prisma.order.findMany({
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
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (!isSchemaMismatchError(error)) throw error;
      logger.error(`Order listing failed for user ${userId}: ${error.message}`);
      return [];
    }

    return orders.map(order => {
      const { orderItems, ...rest } = order;
      return { ...rest, items: orderItems };
    });
  }

  /**
   * Get single order by ID
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

    if (!order) throw new NotFoundError('Order not found');
    if (order.userId !== userId) throw new BadRequestError('Unauthorized access to order');

    const { orderItems, ...rest } = order;
    return { ...rest, items: orderItems };
  }

  /**
   * Cancel order
   */
  async cancelOrder(userId, orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) throw new NotFoundError('Order not found');
    if (order.userId !== userId) throw new BadRequestError('Unauthorized access to order');
    if (!['PROCESSING'].includes(order.status)) throw new BadRequestError('Cannot cancel order at this stage');

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
      for (const item of order.orderItems) {
        if (!item.productId) continue;
        const curP = await tx.product.findUnique({ where: { id: item.productId }, select: { sizeStock: true } });
        if (!curP) continue;
        const restoreStock = { ...(curP.sizeStock || {}) };
        restoreStock[item.size || ''] = (restoreStock[item.size || ''] || 0) + item.quantity;
        await tx.product.update({ where: { id: item.productId }, data: { sizeStock: restoreStock } });
      }
    });

    // Refund if payment was completed
    if (order.paymentStatus === 'COMPLETED' && order.paymentMethod !== 'COD' && order.paymentId) {
      try {
        await paymentService.initiateRefund({
          paymentId: order.paymentId,
          amountInPaise: Math.round(parseFloat(order.total) * 100),
          receipt: `REF-${order.id}`,
          notes: { orderId: order.id, orderNumber: order.orderNumber },
        });
      } catch (refundErr) {
        logger.error(`Refund initiation failed for order ${orderId}: ${refundErr.message}`);
      }
    }

    logger.info(`Order cancelled: ${orderId}`);
    return this.getOrderById(userId, orderId);
  }

  /**
   * Update order status (ADMIN only)
   */
  async updateOrderStatus(orderId, status) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order not found');

    if (order.shippingMethod === 'SHIPROCKET' && status !== 'CANCELLED') {
      throw new BadRequestError('This order is being handled by Shiprocket. Only CANCELLED status can be set manually.');
    }

    const updateData = { status };
    if (status === 'SHIPPED') { updateData.shippingMethod = 'ADMIN'; updateData.shippedAt = new Date(); }
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();
    if (status === 'CANCELLED') updateData.cancelledAt = new Date();

    const updatedOrder = await prisma.order.update({ where: { id: orderId }, data: updateData });
    logger.info(`Order status updated: ${orderId} -> ${status}`);
    return updatedOrder;
  }

  /**
   * Get all orders (ADMIN only)
   */
  async getAllOrders(query = {}) {
    const where = {};
    const VALID_ORDER_STATUSES = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    if (query.status) {
      const s = query.status.toUpperCase();
      if (VALID_ORDER_STATUSES.includes(s)) where.status = s;
    }

    return prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        address: true,
        orderItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Track order publicly
   */
  async trackOrder(orderNumber, email) {
    const order = await prisma.order.findFirst({
      where: { orderNumber, user: { email: { equals: email, mode: 'insensitive' } } },
      include: { orderItems: true, address: true },
    });
    if (!order) throw new NotFoundError('Order not found. Please check your order number and email address.');

    return {
      id: order.id, orderNumber: order.orderNumber, status: order.status,
      paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus,
      total: order.total, createdAt: order.createdAt, deliveredAt: order.deliveredAt,
      address: order.address, items: order.orderItems,
    };
  }
}

module.exports = new OrderService();