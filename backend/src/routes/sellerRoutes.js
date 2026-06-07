// Seller Routes
// All routes require SELLER or ADMIN role authentication

const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// All seller routes require authentication + SELLER or ADMIN role
router.use(protect);
router.use(authorize('SELLER', 'ADMIN'));

// Dashboard
router.get('/stats', sellerController.getSellerStats);

// Products
router.get('/products', sellerController.getSellerProducts);
router.post(
  '/products',
  upload.product.array('images', 5),
  sellerController.createSellerProduct
);
router.put(
  '/products/:id',
  upload.product.array('images', 5),
  sellerController.updateSellerProduct
);
router.delete('/products/:id', sellerController.deleteSellerProduct);
router.delete('/products/:id/images', sellerController.deleteSellerProductImage);

// Revenue & Analytics
router.get('/revenue', sellerController.getSellerRevenue);

// Orders
router.get('/orders', sellerController.getSellerOrders);
router.put('/orders/:orderId/ship', sellerController.markOrderShipped);

module.exports = router;