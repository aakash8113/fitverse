// Payment Controller — PhonePe Standard Checkout
// Handles online payment initiation, webhook, status checks, and refunds

const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * POST /api/payment/initiate
 * Creates a pending order then initiates a PhonePe Standard Checkout payment.
 * Returns the PhonePe redirect URL for the frontend to navigate to.
 * Body: { addressId, paymentMethod: 'CARD'|'WALLET', productIds? }
 */
const initiateOnlinePayment = asyncHandler(async (req, res) => {
  const { addressId, paymentMethod = 'CARD', productIds, coinsToUse, couponCode } = req.body;

  if (!addressId) throw new BadRequestError('addressId is required');

  // Step 1: Create the order in PENDING state (clears cart items too)
  const order = await orderService.createPendingOrder(req.user.id, {
    addressId,
    paymentMethod,
    productIds,
    coinsToUse,
    couponCode,
  });

  // Step 2: Build the redirect URL — PhonePe sends user back here after payment
  const frontendUrl = config.frontend.url || 'http://localhost:5173';
  const redirectUrl = `${frontendUrl}/payment-return?orderId=${order.id}`;

  // Step 3: Convert total to paisa (1 INR = 100 paise, minimum 100 paise)
  const amountInPaise = Math.max(100, Math.round(parseFloat(order.total) * 100));

  // Step 4: Initiate PhonePe payment
  const paymentResponse = await paymentService.initiatePayment({
    merchantOrderId: order.id,
    amountInPaise,
    redirectUrl,
    metaInfo: {
      udf1: req.user.id,
      udf2: order.orderNumber,
    },
  });

  return ApiResponse.success(
    res,
    200,
    {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      redirectUrl: paymentResponse.redirectUrl,
      phonePeOrderId: paymentResponse.phonePeOrderId,
      expireAt: paymentResponse.expireAt,
    },
    'Payment initiated — redirect user to redirectUrl'
  );
});

/**
 * POST /api/payment/webhook
 * PhonePe S2S callback (server-to-server). MUST respond 200 quickly.
 * PhonePe retries if the response is not 200.
 * No auth middleware — PhonePe server calls this directly.
 */
const handleWebhook = async (req, res) => {
  // Always respond 200 immediately to PhonePe to prevent retries,
  // process the update asynchronously.
  res.status(200).json({ success: true });

  try {
    const authorization = req.headers['authorization'] || '';
    // Use rawBody captured by express middleware for accurate signature check
    const bodyString = req.rawBody || JSON.stringify(req.body);

    const callbackResponse = paymentService.validateWebhook(authorization, bodyString);
    const { state, originalMerchantOrderId, orderId: phonePeOrderId } = callbackResponse.payload;

    logger.info(`PhonePe webhook | orderId=${originalMerchantOrderId} | state=${state}`);

    if (state === 'COMPLETED') {
      await orderService.markOrderPaid(originalMerchantOrderId, phonePeOrderId);
    } else if (state === 'FAILED') {
      await orderService.markOrderFailed(originalMerchantOrderId);
    }
    // PENDING state — do nothing, wait for next callback
  } catch (error) {
    logger.error(`PhonePe webhook processing error: ${error.message}`);
    // Response already sent as 200 above
  }
};

/**
 * GET /api/payment/status/:orderId
 * Frontend polls this after returning from PhonePe checkout.
 * Returns the order's current payment status.
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
  let order = await orderService.getOrderById(req.user.id, req.params.orderId);

  // If the order is still PENDING, poll PhonePe directly.
  // This is essential in development (localhost webhook unreachable) and as a
  // fallback in production when the webhook hasn't fired yet.
  if (order.paymentStatus === 'PENDING') {
    try {
      const phonePeStatus = await paymentService.getOrderStatus(order.id);
      logger.info(`PhonePe status poll | orderId=${order.id} | state=${phonePeStatus.state}`);

      if (phonePeStatus.state === 'COMPLETED') {
        await orderService.markOrderPaid(order.id, phonePeStatus.orderId);
        order = await orderService.getOrderById(req.user.id, req.params.orderId);
      } else if (phonePeStatus.state === 'FAILED') {
        await orderService.markOrderFailed(order.id);
        order = await orderService.getOrderById(req.user.id, req.params.orderId);
      }
    } catch (pollError) {
      // Non-fatal — return current DB state and let frontend retry
      logger.warn(`PhonePe status poll failed for order ${order.id}: ${pollError.message}`);
    }
  }

  return ApiResponse.success(
    res,
    200,
    {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
    },
    'Payment status retrieved'
  );
});

/**
 * POST /api/payment/refund/:orderId
 * Initiate a refund for a completed order.
 * (For future use when return/refund feature is built.)
 */
const initiateRefund = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user.id, req.params.orderId);

  if (order.paymentStatus !== 'COMPLETED') {
    throw new BadRequestError('Only completed orders can be refunded');
  }

  if (order.paymentMethod === 'COD') {
    throw new BadRequestError('COD orders cannot be refunded via this endpoint');
  }

  // Build a unique refund ID
  const merchantRefundId = `rfnd_${order.id}_${Date.now()}`;
  const amountInPaise = Math.round(parseFloat(order.total) * 100);

  const refundResponse = await paymentService.initiateRefund({
    merchantRefundId,
    originalMerchantOrderId: order.id,
    amountInPaise,
  });

  // Optimistically mark order as REFUNDED (webhook will confirm)
  await orderService.markOrderRefunded(order.id, refundResponse.refundId || merchantRefundId);

  return ApiResponse.success(
    res,
    200,
    {
      refundId: refundResponse.refundId,
      merchantRefundId,
      state: refundResponse.state,
      amount: refundResponse.amount,
    },
    'Refund initiated successfully'
  );
});

/**
 * GET /api/payment/refund/status/:merchantRefundId
 * Check refund status by merchantRefundId.
 */
const getRefundStatus = asyncHandler(async (req, res) => {
  const { merchantRefundId } = req.params;
  const refundStatus = await paymentService.getRefundStatus(merchantRefundId);

  return ApiResponse.success(res, 200, refundStatus, 'Refund status retrieved');
});

module.exports = {
  initiateOnlinePayment,
  handleWebhook,
  getPaymentStatus,
  initiateRefund,
  getRefundStatus,
};
