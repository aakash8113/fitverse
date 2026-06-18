// Payment Controller — Razorpay
// Handles online payment initiation, webhook, status checks, and refunds

const prisma = require('../config/database');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * POST /api/payment/initiate
 * Validates cart, creates a Razorpay order, returns razorpayOrderId.
 * NO DB order is created at this stage — only after payment verification.
 * Body: { addressId, paymentMethod: 'CARD'|'WALLET', productIds? }
 */
const initiateOnlinePayment = asyncHandler(async (req, res) => {
  const { addressId, paymentMethod = 'CARD', productIds, coinsToUse, couponCode } = req.body;

  if (!addressId) throw new BadRequestError('addressId is required');

  // Validate cart and create Razorpay order — no DB order yet
  const prepaidData = await orderService.initiatePrepaidOrder(req.user.id, {
    addressId,
    paymentMethod,
    productIds,
    coinsToUse,
    couponCode,
  });

  // If coins covered entire amount, prepaidData is already the created order
  if (prepaidData.id) {
    return ApiResponse.success(res, 200, {
      orderId: prepaidData.id,
      orderNumber: prepaidData.orderNumber,
      total: prepaidData.total,
      razorpayOrderId: null,
      paidWithCoins: true,
    }, 'Order created using Fitverse Coins');
  }

  // Return Razorpay order info — frontend will open checkout
  return ApiResponse.success(res, 200, {
    razorpayOrderId: prepaidData.razorpayOrderId,
    receipt: prepaidData.receipt,
    total: prepaidData.amount,
    orderId: null, // No DB order yet
  }, 'Razorpay order created — open checkout');
});

/**
 * POST /api/payment/verify
 * Verifies Razorpay payment signature, then creates the DB order.
 * Called by the frontend after successful Razorpay Checkout.
 * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, receipt }
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, receipt } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !receipt) {
    throw new BadRequestError('Missing required payment verification fields');
  }

  // Verify the payment signature
  const isValid = paymentService.verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!isValid) {
    throw new BadRequestError('Payment verification failed — invalid signature');
  }

  // Fetch the Razorpay order to get notes (which contain our cart info)
  const payments = await paymentService.getPaymentsForOrder(razorpayOrderId);
  const capturedPayment = payments.find(p => p.status === 'captured');
  
  if (!capturedPayment) {
    throw new BadRequestError('No captured payment found for this order');
  }

  // Fetch the Razorpay order to get notes
  // We stored cart info in notes during initiatePrepaidOrder
  // But notes are not returned by fetchPayments, so we need to reconstruct from receipt
  // The receipt is our orderNumber, which we stored in the Razorpay order
  
  // Reconstruct order data from the receipt (which is our order number)
  // We need to re-fetch cart data to create the order
  // Actually, we stored everything in Razorpay order notes
  // Let's fetch the Razorpay order to get notes
  const razorpay = require('razorpay');
  const rzpClient = new razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  });
  
  const razorpayOrder = await rzpClient.orders.fetch(razorpayOrderId);
  const notes = razorpayOrder.notes || {};

  // Reconstruct the prepaid data from notes
  const userId = req.user.id;
  const addressId = notes.addressId;
  const paymentMethod = notes.paymentMethod || 'CARD';
  const productIds = notes.productIds ? JSON.parse(notes.productIds) : null;
  const coinsToUse = parseInt(notes.coinsToUse || '0');
  const couponCode = notes.couponCode || null;
  const subtotal = parseFloat(notes.subtotal || '0');
  const couponDiscount = parseFloat(notes.couponDiscount || '0');

  // Get cart and items to order
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) throw new BadRequestError('Cart is empty');

  const itemsToOrder = productIds?.length
    ? cart.items.filter((item) => productIds.includes(item.productId))
    : cart.items;
  if (itemsToOrder.length === 0) throw new BadRequestError('No matching items found in cart');

  // Validate coupon if used
  let validatedCoupon = null;
  if (couponCode) {
    const couponService = require('./couponService');
    const couponResult = await couponService.validateCoupon(userId, couponCode, itemsToOrder);
    validatedCoupon = couponResult.coupon;
  }

  // Create the DB order now that payment is confirmed
  const prepaidData = {
    receipt: notes.receipt || receipt,
    addressId,
    paymentMethod,
    subtotal,
    shipping: 0,
    tax: 0,
    amount: capturedPayment.amount / 100,
    coinsToUse,
    couponCode,
    couponDiscount,
    validatedCoupon,
    itemsToOrder,
    cart,
  };

  const order = await orderService.createPaidOrder(userId, prepaidData, razorpayPaymentId);

  return ApiResponse.success(res, 200, {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
  }, 'Payment verified and order created successfully');
});

/**
 * POST /api/payment/webhook
 * Razorpay S2S callback. Responds 200 immediately.
 */
const handleWebhook = async (req, res) => {
  res.status(200).json({ success: true });

  try {
    const signature = req.headers['x-razorpay-signature'] || '';
    const bodyString = req.rawBody || JSON.stringify(req.body);

    const isValid = paymentService.validateWebhook(bodyString, signature);
    if (!isValid) {
      logger.warn('Razorpay webhook validation failed');
      return;
    }

    const event = req.body;
    logger.info(`Razorpay webhook | event=${event.event}`);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      // Check if order already exists for this payment
      const existingOrder = await prisma.order.findFirst({
        where: { paymentId: razorpayPaymentId },
      });

      if (existingOrder) {
        logger.info(`Order already exists for payment ${razorpayPaymentId}, skipping`);
        return;
      }

      // Fetch Razorpay order to get notes
      const razorpay = require('razorpay');
      const rzpClient = new razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret,
      });
      
      const razorpayOrder = await rzpClient.orders.fetch(razorpayOrderId);
      const notes = razorpayOrder.notes || {};
      const userId = notes.userId;

      if (!userId) {
        logger.warn(`Razorpay webhook: no userId in notes for order ${razorpayOrderId}`);
        return;
      }

      // Reconstruct and create order
      const addressId = notes.addressId;
      const paymentMethod = notes.paymentMethod || 'CARD';
      const productIds = notes.productIds ? JSON.parse(notes.productIds) : null;
      const coinsToUse = parseInt(notes.coinsToUse || '0');
      const couponCode = notes.couponCode || null;
      const subtotal = parseFloat(notes.subtotal || '0');
      const couponDiscount = parseFloat(notes.couponDiscount || '0');

      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
      if (!cart || cart.items.length === 0) {
        logger.warn(`Razorpay webhook: cart empty for user ${userId}`);
        return;
      }

      const itemsToOrder = productIds?.length
        ? cart.items.filter((item) => productIds.includes(item.productId))
        : cart.items;

      let validatedCoupon = null;
      if (couponCode) {
        const couponService = require('./couponService');
        const couponResult = await couponService.validateCoupon(userId, couponCode, itemsToOrder);
        validatedCoupon = couponResult.coupon;
      }

      const prepaidData = {
        receipt: notes.receipt,
        addressId,
        paymentMethod,
        subtotal,
        shipping: 0,
        tax: 0,
        amount: payment.amount / 100,
        coinsToUse,
        couponCode,
        couponDiscount,
        validatedCoupon,
        itemsToOrder,
        cart,
      };

      await orderService.createPaidOrder(userId, prepaidData, razorpayPaymentId);
      logger.info(`Razorpay webhook: order created for payment ${razorpayPaymentId}`);
    }
  } catch (error) {
    logger.error(`Razorpay webhook processing error: ${error.message}`);
  }
};

/**
 * GET /api/payment/status/:orderId
 * Frontend polls this after returning from Razorpay checkout.
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user.id, req.params.orderId);

  return ApiResponse.success(res, 200, {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
  }, 'Payment status retrieved');
});

/**
 * POST /api/payment/refund/:orderId
 * Initiate a refund for a completed order via Razorpay.
 */
const initiateRefund = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user.id, req.params.orderId);

  if (order.paymentStatus !== 'COMPLETED') {
    throw new BadRequestError('Only completed orders can be refunded');
  }

  if (order.paymentMethod === 'COD') {
    throw new BadRequestError('COD orders cannot be refunded via this endpoint');
  }

  if (!order.paymentId) {
    throw new BadRequestError('No payment ID found for this order');
  }

  const amountInPaise = Math.round(parseFloat(order.total) * 100);

  const refundResponse = await paymentService.initiateRefund({
    paymentId: order.paymentId,
    amountInPaise,
    receipt: `REF-${order.id}`,
    notes: {
      orderId: order.id,
      orderNumber: order.orderNumber,
    },
  });

  await orderService.markOrderRefunded(order.id, refundResponse.refundId);

  return ApiResponse.success(res, 200, {
    refundId: refundResponse.refundId,
    amount: refundResponse.amount,
    status: refundResponse.status,
    speedProcessed: refundResponse.speedProcessed,
  }, 'Refund initiated successfully');
});

/**
 * GET /api/payment/refund/status/:refundId
 */
const getRefundStatus = asyncHandler(async (req, res) => {
  const { refundId } = req.params;
  const refundStatus = await paymentService.fetchRefund(refundId);
  return ApiResponse.success(res, 200, refundStatus, 'Refund status retrieved');
});

module.exports = {
  initiateOnlinePayment,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
  initiateRefund,
  getRefundStatus,
};