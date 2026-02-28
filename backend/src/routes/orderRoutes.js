// Order Routes
// Routes for order management

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize, requireEmailVerification } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createOrderSchema } = require('../utils/validation');

// All order routes require authentication and email verification
router.get('/track', orderController.trackOrder); // Public - no auth needed

router.use(protect, requireEmailVerification);

// Admin route - Get all orders
router.get('/admin/all', authorize('ADMIN'), orderController.getAllOrders);

// User routes
router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id/cancel', orderController.cancelOrder);

// Admin route - Update order status
router.put('/:id/status', authorize('ADMIN'), orderController.updateOrderStatus);

module.exports = router;
