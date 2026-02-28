// Order Controller
// Handles HTTP requests for order management

const orderService = require('../services/orderService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route   POST /api/orders
 * @desc    Create order from cart
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  
  return ApiResponse.success(
    res,
    201,
    order,
    'Order placed successfully'
  );
});

/**
 * @route   GET /api/orders
 * @desc    Get user's orders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getOrders(req.user.id, req.query);
  
  return ApiResponse.success(
    res,
    200,
    orders,
    'Orders retrieved successfully'
  );
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order by ID
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user.id, req.params.id);
  
  return ApiResponse.success(
    res,
    200,
    order,
    'Order retrieved successfully'
  );
});

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user.id, req.params.id);
  
  return ApiResponse.success(
    res,
    200,
    order,
    'Order cancelled successfully'
  );
});

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status (ADMIN)
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, status);
  
  return ApiResponse.success(
    res,
    200,
    order,
    'Order status updated successfully'
  );
});

/**
 * @route   GET /api/orders/admin/all
 * @desc    Get all orders (ADMIN)
 * @access  Private/Admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getAllOrders(req.query);
  
  return ApiResponse.success(
    res,
    200,
    orders,
    'All orders retrieved successfully'
  );
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
};
