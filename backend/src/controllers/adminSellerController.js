// Admin Seller Controller
// Admin endpoints for managing seller product approvals

const adminSellerService = require('../services/adminSellerService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route   GET /api/admin/seller-requests
 * @desc    Get all seller product requests with status filter
 * @access  Private/Admin
 */
const getSellerRequests = asyncHandler(async (req, res) => {
  const result = await adminSellerService.getSellerRequests(req.query);
  return ApiResponse.success(res, 200, result, 'Seller requests retrieved');
});

/**
 * @route   PUT /api/admin/seller-requests/:id/approve
 * @desc    Approve a seller product with admin's final price
 * @access  Private/Admin
 */
const approveSellerProduct = asyncHandler(async (req, res) => {
  const { finalPrice } = req.body;
  const product = await adminSellerService.approveSellerProduct(req.params.id, finalPrice);
  return ApiResponse.success(res, 200, product, 'Product approved successfully');
});

/**
 * @route   PUT /api/admin/seller-requests/:id/reject
 * @desc    Reject a seller product
 * @access  Private/Admin
 */
const rejectSellerProduct = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const product = await adminSellerService.rejectSellerProduct(req.params.id, reason);
  return ApiResponse.success(res, 200, product, 'Product rejected');
});

/**
 * @route   GET /api/admin/seller-requests/pending-count
 * @desc    Get count of pending seller requests
 * @access  Private/Admin
 */
const getPendingCount = asyncHandler(async (req, res) => {
  const count = await adminSellerService.getPendingCount();
  return ApiResponse.success(res, 200, { count }, 'Pending count retrieved');
});

module.exports = {
  getSellerRequests,
  approveSellerProduct,
  rejectSellerProduct,
  getPendingCount,
};