// Seller Controller
// Handles HTTP requests for seller operations

const sellerService = require('../services/sellerService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route   GET /api/seller/stats
 * @desc    Get seller dashboard stats
 * @access  Private/Seller
 */
const getSellerStats = asyncHandler(async (req, res) => {
  const stats = await sellerService.getSellerStats(req.user.id);
  return ApiResponse.success(res, 200, stats, 'Seller stats retrieved');
});

/**
 * @route   GET /api/seller/products
 * @desc    Get seller's own products
 * @access  Private/Seller
 */
const getSellerProducts = asyncHandler(async (req, res) => {
  const result = await sellerService.getSellerProducts(req.user.id, req.query);
  return ApiResponse.paginated(
    res,
    result.products,
    result.pagination.currentPage,
    result.pagination.itemsPerPage,
    result.pagination.totalItems
  );
});

/**
 * @route   POST /api/seller/products
 * @desc    Create a product as seller
 * @access  Private/Seller
 */
const createSellerProduct = asyncHandler(async (req, res) => {
  const product = await sellerService.createSellerProduct(req.user.id, req.body, req.files);
  return ApiResponse.success(res, 201, product, 'Product created successfully');
});

/**
 * @route   PUT /api/seller/products/:id
 * @desc    Update seller's own product
 * @access  Private/Seller
 */
const updateSellerProduct = asyncHandler(async (req, res) => {
  const product = await sellerService.updateSellerProduct(req.user.id, req.params.id, req.body, req.files);
  return ApiResponse.success(res, 200, product, 'Product updated successfully');
});

/**
 * @route   DELETE /api/seller/products/:id
 * @desc    Delete seller's own product (soft delete)
 * @access  Private/Seller
 */
const deleteSellerProduct = asyncHandler(async (req, res) => {
  const result = await sellerService.deleteSellerProduct(req.user.id, req.params.id);
  return ApiResponse.success(res, 200, null, result.message);
});

/**
 * @route   DELETE /api/seller/products/:id/images
 * @desc    Delete an image from seller's product
 * @access  Private/Seller
 */
const deleteSellerProductImage = asyncHandler(async (req, res) => {
  const { imagePath } = req.body;
  const product = await sellerService.deleteSellerProductImage(req.user.id, req.params.id, imagePath);
  return ApiResponse.success(res, 200, product, 'Image deleted successfully');
});

/**
 * @route   GET /api/seller/revenue
 * @desc    Get revenue analytics for seller's products
 * @access  Private/Seller
 */
const getSellerRevenue = asyncHandler(async (req, res) => {
  const revenue = await sellerService.getSellerRevenue(req.user.id);
  return ApiResponse.success(res, 200, revenue, 'Revenue data retrieved');
});

/**
 * @route   GET /api/seller/orders
 * @desc    Get orders containing seller's products
 * @access  Private/Seller
 */
const getSellerOrders = asyncHandler(async (req, res) => {
  const result = await sellerService.getSellerOrders(req.user.id, req.query);
  return ApiResponse.success(res, 200, result, 'Orders retrieved');
});

/**
 * @route   PUT /api/seller/orders/:orderId/ship
 * @desc    Mark an order as shipped (seller action)
 * @access  Private/Seller
 */
const markOrderShipped = asyncHandler(async (req, res) => {
  const result = await sellerService.markOrderItemShipped(req.user.id, req.params.orderId);
  return ApiResponse.success(res, 200, result, 'Order marked as shipped');
});

module.exports = {
  getSellerStats,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  deleteSellerProductImage,
  getSellerRevenue,
  getSellerOrders,
  markOrderShipped,
};