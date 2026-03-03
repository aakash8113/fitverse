// Payment Service — PhonePe Node.js Backend SDK v2.0.3
// Docs: https://developer.phonepe.com/payment-gateway/backend-sdk/nodejs-be-sdk

const { StandardCheckoutClient, Env, StandardCheckoutPayRequest, MetaInfo, RefundRequest } = require('pg-sdk-node');
const config = require('../config/env');
const logger = require('../config/logger');

// 
// SDK client initialisation (singleton)
// 
let _client = null;

function getClient() {
  if (_client) return _client;

  const { clientId, clientSecret, clientVersion, env } = config.phonepe;

  if (!clientId || !clientSecret) {
    logger.warn('  PhonePe credentials not set — payments will be unavailable until configured.');
    return null;
  }

  const sdkEnv = env === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;
  _client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, sdkEnv);

  logger.info(' PhonePe SDK initialised in ' + env + ' mode');
  return _client;
}

class PaymentService {
  // 
  // Initiate Payment (redirect user to PhonePe)
  // 
  /**
   * Create a PhonePe Standard Checkout payment.
   * @param {Object} opts
   * @param {string} opts.merchantOrderId  - Your unique order ID (we use DB order.id)
   * @param {number} opts.amountInPaise    - Amount in paisa  (INR 1 = 100 paise)
   * @param {string} opts.redirectUrl      - URL to redirect after payment (success or failure)
   * @param {Object} [opts.metaInfo]       - Optional UDFs stored in PhonePe
   * @returns {Promise<{redirectUrl: string, phonePeOrderId: string, state: string, expireAt: string}>}
   */
  async initiatePayment({ merchantOrderId, amountInPaise, redirectUrl, metaInfo = {} }) {
    const client = getClient();
    if (!client) {
      throw new Error('PhonePe SDK not initialised — check PHONEPE_CLIENT_ID / PHONEPE_CLIENT_SECRET in .env');
    }

    try {
      const meta = MetaInfo.builder()
        .udf1(metaInfo.udf1 || '')
        .udf2(metaInfo.udf2 || '')
        .udf3(metaInfo.udf3 || '')
        .build();

      const request = StandardCheckoutPayRequest.builder()
        .merchantOrderId(merchantOrderId)
        .amount(amountInPaise)
        .redirectUrl(redirectUrl)
        .expireAfter(1800)
        .metaInfo(meta)
        .build();

      const response = await client.pay(request);

      logger.info('PhonePe payment initiated | merchantOrderId=' + merchantOrderId + ' | state=' + response.state);

      return {
        redirectUrl: response.redirectUrl,
        phonePeOrderId: response.orderId,
        state: response.state,
        expireAt: response.expireAt,
      };
    } catch (error) {
      logger.error('PhonePe initiatePayment error: ' + error.message);
      throw error;
    }
  }

  // 
  // Check Order Status
  // 
  /**
   * Check the current status of a PhonePe order.
   * @param {string} merchantOrderId - The same ID passed during initiation
   */
  async getOrderStatus(merchantOrderId) {
    const client = getClient();
    if (!client) throw new Error('PhonePe SDK not initialised');

    try {
      const response = await client.getOrderStatus(merchantOrderId);
      return {
        state: response.state,
        amount: response.amount,
        orderId: response.orderId,
        paymentDetails: response.paymentDetails || [],
      };
    } catch (error) {
      logger.error('PhonePe getOrderStatus error: ' + error.message);
      throw error;
    }
  }

  // 
  // Validate Webhook Callback
  // 
  /**
   * Validate an incoming PhonePe S2S webhook.
   * @param {string} authorization  - from request headers
   * @param {string} responseBody   - raw string body
   */
  validateWebhook(authorization, responseBody) {
    const client = getClient();
    if (!client) throw new Error('PhonePe SDK not initialised');

    const { webhookUsername, webhookPassword } = config.phonepe;

    return client.validateCallback(
      webhookUsername,
      webhookPassword,
      authorization,
      responseBody,
    );
  }

  // 
  // Initiate Refund
  // 
  /**
   * Initiate a PhonePe refund.
   * @param {Object} opts
   * @param {string} opts.merchantRefundId        - Your unique refund ID
   * @param {string} opts.originalMerchantOrderId - The order ID the refund is for
   * @param {number} opts.amountInPaise            - Amount to refund in paisa
   */
  async initiateRefund({ merchantRefundId, originalMerchantOrderId, amountInPaise }) {
    const client = getClient();
    if (!client) throw new Error('PhonePe SDK not initialised');

    try {
      const request = RefundRequest.builder()
        .merchantRefundId(merchantRefundId)
        .originalMerchantOrderId(originalMerchantOrderId)
        .amount(amountInPaise)
        .build();

      const response = await client.refund(request);

      logger.info('PhonePe refund initiated | merchantRefundId=' + merchantRefundId + ' | state=' + response.state);

      return {
        refundId: response.refundId,
        state: response.state,
        amount: response.amount,
      };
    } catch (error) {
      logger.error('PhonePe initiateRefund error: ' + error.message);
      throw error;
    }
  }

  // 
  // Check Refund Status
  // 
  /**
   * Check status of a PhonePe refund.
   * @param {string} merchantRefundId - The refund ID used during initiation
   */
  async getRefundStatus(merchantRefundId) {
    const client = getClient();
    if (!client) throw new Error('PhonePe SDK not initialised');

    try {
      const response = await client.getRefundStatus(merchantRefundId);
      return {
        state: response.state,
        amount: response.amount,
        merchantRefundId: response.merchantRefundId,
      };
    } catch (error) {
      logger.error('PhonePe getRefundStatus error: ' + error.message);
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
