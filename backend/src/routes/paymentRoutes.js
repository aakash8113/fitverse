const express = require('express');
const router = express.Router();
const {
  initiateOnlinePayment,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
  initiateRefund,
  getRefundStatus,
} = require('../controllers/paymentController');
const { protect, requireEmailVerification, authorize } = require('../middlewares/auth');

// POST /api/payment/initiate — authenticated user creates a Razorpay order
router.post('/initiate', protect, requireEmailVerification, initiateOnlinePayment);

// POST /api/payment/verify — verify payment signature after Razorpay checkout
router.post('/verify', protect, verifyPayment);

// POST /api/payment/webhook — Razorpay S2S callback (NO auth, server-to-server)
router.post('/webhook', handleWebhook);

// GET /api/payment/status/:orderId — frontend polls for payment confirmation
router.get('/status/:orderId', protect, getPaymentStatus);

// POST /api/payment/refund/:orderId — admin-only refund
router.post('/refund/:orderId', protect, authorize('ADMIN'), initiateRefund);

// GET /api/payment/refund/status/:refundId — check refund status
router.get('/refund/status/:refundId', protect, authorize('ADMIN'), getRefundStatus);

module.exports = router;
