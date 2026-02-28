// Product Controller
// Handles HTTP requests for product management

const productService = require('../services/productService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route   POST /api/products
 * @desc    Create new product (ADMIN)
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.files);
  
  return ApiResponse.success(
    res,
    201,
    product,
    'Product created successfully'
  );
});

/**
 * @route   GET /api/products
 * @desc    Get all products with filters
 * @access  Public
 */
const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts(req.query);
  
  return ApiResponse.paginated(
    res,
    result.products,
    result.pagination.currentPage,
    result.pagination.itemsPerPage,
    result.pagination.totalItems
  );
});

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  
  return ApiResponse.success(
    res,
    200,
    product,
    'Product retrieved successfully'
  );
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update product (ADMIN)
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(
    req.params.id,
    req.body,
    req.files
  );
  
  return ApiResponse.success(
    res,
    200,
    product,
    'Product updated successfully'
  );
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (ADMIN)
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);
  
  return ApiResponse.success(
    res,
    200,
    null,
    result.message
  );
});

/**
 * @route   DELETE /api/products/:id/images
 * @desc    Delete product image (ADMIN)
 * @access  Private/Admin
 */
const deleteProductImage = asyncHandler(async (req, res) => {
  const { imagePath } = req.body;
  const product = await productService.deleteProductImage(req.params.id, imagePath);
  
  return ApiResponse.success(
    res,
    200,
    product,
    'Image deleted successfully'
  );
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  deleteProductImage,
};
