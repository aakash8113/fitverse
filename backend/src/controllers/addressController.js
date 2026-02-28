// Address Controller
// Handles HTTP requests for address management

const addressService = require('../services/addressService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route   GET /api/addresses
 * @desc    Get all user addresses
 * @access  Private
 */
const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.getAddresses(req.user.id);
  
  return ApiResponse.success(
    res,
    200,
    addresses,
    'Addresses retrieved successfully'
  );
});

/**
 * @route   GET /api/addresses/:id
 * @desc    Get single address by ID
 * @access  Private
 */
const getAddressById = asyncHandler(async (req, res) => {
  const address = await addressService.getAddressById(req.user.id, req.params.id);
  
  return ApiResponse.success(
    res,
    200,
    address,
    'Address retrieved successfully'
  );
});

/**
 * @route   POST /api/addresses
 * @desc    Create new address
 * @access  Private
 */
const createAddress = asyncHandler(async (req, res) => {
  const address = await addressService.createAddress(req.user.id, req.body);
  
  return ApiResponse.success(
    res,
    201,
    address,
    'Address created successfully'
  );
});

/**
 * @route   PUT /api/addresses/:id
 * @desc    Update address
 * @access  Private
 */
const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressService.updateAddress(
    req.user.id,
    req.params.id,
    req.body
  );
  
  return ApiResponse.success(
    res,
    200,
    address,
    'Address updated successfully'
  );
});

/**
 * @route   DELETE /api/addresses/:id
 * @desc    Delete address
 * @access  Private
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const result = await addressService.deleteAddress(req.user.id, req.params.id);
  
  return ApiResponse.success(
    res,
    200,
    null,
    result.message
  );
});

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
};
