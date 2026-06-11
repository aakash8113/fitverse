// Admin Seller Routes
// Admin-only routes for managing seller product approvals

const express = require('express');
const router = express.Router();
const adminSellerController = require('../controllers/adminSellerController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/seller-requests/pending-count', adminSellerController.getPendingCount);
router.get('/seller-requests', adminSellerController.getSellerRequests);
router.put('/seller-requests/:id/approve', adminSellerController.approveSellerProduct);
router.put('/seller-requests/:id/reject', adminSellerController.rejectSellerProduct);

module.exports = router;