// Cart Routes
// Routes for shopping cart management

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  addToCartSchema,
  updateCartItemSchema,
} = require('../utils/validation');

// Cart requires authentication only. Checkout/order placement remains verification-gated.
router.use(protect);

// Cart routes
router.get('/', cartController.getCart);
router.post('/', validate(addToCartSchema), cartController.addToCart);
router.put('/:itemId', validate(updateCartItemSchema), cartController.updateCartItem);
router.delete('/:itemId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;
