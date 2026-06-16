// Shipping Routes — Shiprocket Integration
// Routes for Shiprocket shipping operations

const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { protect, authorize, requireEmailVerification } = require('../middlewares/auth');

// ── Public routes ───────────────────────────────────────────────────

// POST /api/shipping/order-status — Shiprocket S2S callback (NO auth, server-to-server)
// ⚠️ Shiprocket blocks URLs containing "shiprocket", "kartrocket", "sr", "kr"
// Avoided those keywords — route is /api/shipping/order-status
router.post('/order-status', shippingController.handleWebhook);

// GET /api/shipping/track/:awbCode — Public tracking lookup
router.get('/track/:awbCode', shippingController.trackShipment);

// ── Protected routes (admin only) ──────────────────────────────────
router.use(protect);

// POST /api/shipping/mark-admin-shipment — Mark order as admin-managed (not Shiprocket)
router.post('/mark-admin-shipment', authorize('ADMIN'), shippingController.markAsAdminShipment);

// POST /api/shipping/check-serviceability — Check if delivery pincode is serviceable by Shiprocket
router.post('/check-serviceability', authorize('ADMIN'), shippingController.checkServiceability);

// POST /api/shipping/send-to-shiprocket/:orderId — Send an order to Shiprocket
router.post('/send-to-shiprocket/:orderId', requireEmailVerification, authorize('ADMIN'), shippingController.sendToShiprocket);

// POST /api/shipping/generate-label/:orderId — Generate label for a shipped order
router.post('/generate-label/:orderId', authorize('ADMIN'), shippingController.generateLabel);

// POST /api/shipping/cancel/:orderId — Cancel a Shiprocket shipment
router.post('/cancel/:orderId', authorize('ADMIN'), shippingController.cancelShiprocketShipment);

module.exports = router;