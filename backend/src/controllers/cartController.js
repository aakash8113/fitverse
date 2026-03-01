// Cart Controller
// Handles HTTP requests for cart management

const cartService = require('../services/cartService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getOrCreateCart(req.user.id);
  
  return ApiResponse.success(
    res,
    200,
    cart,
    'Cart retrieved successfully'
  );
});

/**
 * @route   POST /api/cart
 * @desc    Add item to cart
 * @access  Private
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, size } = req.body;
  const cart = await cartService.addToCart(req.user.id, productId, quantity, size);
  
  return ApiResponse.success(
    res,
    200,
    cart,
    'Item added to cart'
  );
});

/**
 * @route   PUT /api/cart/:itemId
 * @desc    Update cart item quantity
 * @access  Private
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await cartService.updateCartItem(
    req.user.id,
    req.params.itemId,
    quantity
  );
  
  return ApiResponse.success(
    res,
    200,
    cart,
    'Cart updated successfully'
  );
});

/**
 * @route   DELETE /api/cart/:itemId
 * @desc    Remove item from cart
 * @access  Private
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await cartService.removeFromCart(req.user.id, req.params.itemId);
  
  return ApiResponse.success(
    res,
    200,
    cart,
    'Item removed from cart'
  );
});

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user.id);
  
  return ApiResponse.success(
    res,
    200,
    cart,
    'Cart cleared successfully'
  );
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
