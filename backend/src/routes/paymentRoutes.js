const express = require('express');
const router = express.Router();
const {
  initiateOnlinePayment,
  handleWebhook,
  getPaymentStatus,
  initiateRefund,
  getRefundStatus,
} = require('../controllers/paymentController');
const { protect, requireEmailVerification, authorize } = require('../middlewares/auth');

// POST /api/payment/initiate — authenticated user initiates PhonePe checkout
router.post('/initiate', protect, requireEmailVerification, initiateOnlinePayment);

// POST /api/payment/webhook — PhonePe S2S callback (NO auth, server-to-server)
router.post('/webhook', handleWebhook);

// GET /api/payment/status/:orderId — frontend polls for payment confirmation
router.get('/status/:orderId', protect, getPaymentStatus);

// POST /api/payment/refund/:orderId — admin-only refund
router.post('/refund/:orderId', protect, authorize('ADMIN'), initiateRefund);

// GET /api/payment/refund/status/:merchantRefundId — check refund status
router.get('/refund/status/:merchantRefundId', protect, authorize('ADMIN'), getRefundStatus);

module.exports = router;
