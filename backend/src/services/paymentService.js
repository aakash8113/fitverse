// Payment Service — Razorpay
// Docs: https://razorpay.com/docs/api/
// Uses the official Razorpay Node.js SDK

const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../config/logger');

// 
// Razorpay client initialisation (singleton)
// 
let _client = null;

function getClient() {
  if (_client) return _client;

  const { keyId, keySecret } = config.razorpay;

  if (!keyId || !keySecret) {
    logger.warn('Razorpay credentials not set — payments will be unavailable until configured.');
    return null;
  }

  _client = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  logger.info('Razorpay client initialised');
  return _client;
}

class PaymentService {
  // 
  // Create Razorpay Order (for checkout)
  // 
  /**
   * Create a Razorpay order for payment initiation.
   * @param {Object} opts
   * @param {string} opts.merchantOrderId  - Our internal order ID (used as receipt)
   * @param {number} opts.amountInPaise    - Amount in paisa (INR 1 = 100 paise)
   * @param {Object} [opts.notes]          - Optional notes stored in Razorpay
   * @returns {Promise<{id: string, amount: number, currency: string, receipt: string, status: string}>}
   */
  async createOrder({ merchantOrderId, amountInPaise, notes = {} }) {
    const client = getClient();
    if (!client) {
      throw new Error('Razorpay not initialised — check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env');
    }

    try {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: merchantOrderId,
        notes,
      };

      const order = await client.orders.create(options);

      logger.info(`Razorpay order created | id=${order.id} | receipt=${merchantOrderId} | amount=${amountInPaise}`);

      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
      };
    } catch (error) {
      logger.error(`Razorpay createOrder error: ${error.message}`);
      throw error;
    }
  }

  // 
  // Verify Payment Signature (webhook & callback)
  // 
  /**
   * Verify Razorpay payment signature.
   * Used to validate that the payment was genuinely made to you.
   * @param {Object} opts
   * @param {string} opts.razorpayOrderId   - Order ID from Razorpay
   * @param {string} opts.razorpayPaymentId - Payment ID from Razorpay
   * @param {string} opts.razorpaySignature - Signature from Razorpay callback
   * @returns {boolean}
   */
  verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const { keySecret } = config.razorpay;
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    return expectedSignature === razorpaySignature;
  }

  // 
  // Fetch Payments for an Order
  // 
  /**
   * Get all payments made for a Razorpay order.
   * Used for status polling when webhook hasn't fired yet.
   * @param {string} razorpayOrderId - Razorpay order ID
   * @returns {Promise<Array>} List of payments
   */
  async getPaymentsForOrder(razorpayOrderId) {
    const client = getClient();
    if (!client) throw new Error('Razorpay not initialised');

    try {
      const payments = await client.orders.fetchPayments(razorpayOrderId);
      return payments.items || [];
    } catch (error) {
      logger.error(`Razorpay getPaymentsForOrder error: ${error.message}`);
      throw error;
    }
  }

  // 
  // Fetch Payment by ID
  // 
  /**
   * Fetch a specific payment by its Razorpay payment ID.
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} Payment details
   */
  async fetchPayment(paymentId) {
    const client = getClient();
    if (!client) throw new Error('Razorpay not initialised');

    try {
      const payment = await client.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      logger.error(`Razorpay fetchPayment error: ${error.message}`);
      throw error;
    }
  }

  // 
  // Validate Webhook
  // 
  /**
   * Validate an incoming Razorpay webhook.
   * @param {string} body - Raw request body as string
   * @param {string} signature - x-razorpay-signature header value
   * @returns {boolean}
   */
  validateWebhook(body, signature) {
    const { webhookSecret } = config.razorpay;
    if (!webhookSecret) {
      logger.warn('Razorpay webhook secret not configured — webhook validation skipped');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }

  // 
  // Initiate Refund
  // 
  /**
   * Initiate a refund for a captured payment.
   * @param {Object} opts
   * @param {string} opts.paymentId       - Razorpay payment ID to refund
   * @param {number} opts.amountInPaise   - Amount to refund in paisa (partial refund)
   * @param {string} [opts.receipt]       - Optional receipt for the refund
   * @param {Object} [opts.notes]         - Optional notes
   * @returns {Promise<Object>} Refund details
   */
  async initiateRefund({ paymentId, amountInPaise, receipt, notes = {} }) {
    const client = getClient();
    if (!client) throw new Error('Razorpay not initialised');

    try {
      const refundOptions = {
        amount: amountInPaise,
        notes,
      };
      if (receipt) refundOptions.receipt = receipt;

      const refund = await client.payments.refund(paymentId, refundOptions);

      logger.info(`Razorpay refund initiated | paymentId=${paymentId} | refundId=${refund.id} | amount=${amountInPaise}`);

      return {
        refundId: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        speedRequested: refund.speed_requested,
        speedProcessed: refund.speed_processed,
      };
    } catch (error) {
      logger.error(`Razorpay initiateRefund error: ${error.message}`);
      throw error;
    }
  }

  // 
  // Fetch Refund
  // 
  /**
   * Fetch details of a specific refund.
   * @param {string} refundId - Razorpay refund ID
   * @returns {Promise<Object>} Refund details
   */
  async fetchRefund(refundId) {
    const client = getClient();
    if (!client) throw new Error('Razorpay not initialised');

    try {
      const refund = await client.refunds.fetch(refundId);
      return refund;
    } catch (error) {
      logger.error(`Razorpay fetchRefund error: ${error.message}`);
      throw error;
    }
  }

  // 
  // COD — legacy helper (unchanged)
  // 
  async processCOD(orderData) {
    const paymentId = 'cod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    logger.info('COD order created: ' + paymentId);
    return { paymentId, status: 'cod_pending' };
  }
}

module.exports = new PaymentService();