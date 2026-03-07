// Coupon Routes

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const couponController = require('../controllers/couponController');

// ── User routes ──────────────────────────────────────────────────────────────
// Validate a coupon code against the user's cart
router.post('/validate', protect, couponController.validateCoupon);

// ── Admin routes ─────────────────────────────────────────────────────────────
router.get('/admin',              protect, authorize('ADMIN'), couponController.listCoupons);
router.post('/admin',             protect, authorize('ADMIN'), couponController.createCoupon);
router.get('/admin/:id',          protect, authorize('ADMIN'), couponController.getCoupon);
router.put('/admin/:id',          protect, authorize('ADMIN'), couponController.updateCoupon);
router.delete('/admin/:id',       protect, authorize('ADMIN'), couponController.deleteCoupon);
router.get('/admin/:id/usages',    protect, authorize('ADMIN'), couponController.getCouponUsages);
router.post('/admin/:id/block-user',           protect, authorize('ADMIN'), couponController.blockUser);
router.delete('/admin/:id/block-user/:userId', protect, authorize('ADMIN'), couponController.unblockUser);
router.post('/admin/:id/reset-usage',          protect, authorize('ADMIN'), couponController.resetUsageCount);

module.exports = router;
