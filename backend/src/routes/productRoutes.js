// Product Routes
// Routes for product management

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const {
  createProductSchema,
  updateProductSchema,
} = require('../utils/validation');

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Admin routes - Create product
router.post(
  '/',
  protect,
  authorize('ADMIN'),
  upload.array('images', 5), // Max 5 images
  validate(createProductSchema),
  productController.createProduct
);

// Admin routes - Update product
router.put(
  '/:id',
  protect,
  authorize('ADMIN'),
  upload.array('images', 5),
  validate(updateProductSchema),
  productController.updateProduct
);

// Admin routes - Delete product
router.delete(
  '/:id',
  protect,
  authorize('ADMIN'),
  productController.deleteProduct
);

// Admin routes - Delete product image
router.delete(
  '/:id/images',
  protect,
  authorize('ADMIN'),
  productController.deleteProductImage
);

module.exports = router;
