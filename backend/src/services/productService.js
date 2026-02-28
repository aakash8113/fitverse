// Product Service
// Business logic for product management

const prisma = require('../config/database');
const imageService = require('./imageService');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePagination } = require('../utils/helpers');
const logger = require('../config/logger');

class ProductService {
  /**
   * Create new product (ADMIN only)
   * @param {Object} productData - Product details
   * @param {Array} images - Uploaded image files
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData, images = []) {
    // Upload images
    let imagePaths = [];
    if (images && images.length > 0) {
      imagePaths = await imageService.uploadMultiple(images, 'products');
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        price: Math.round(parseFloat(productData.price) * 100) / 100,
        stock: parseInt(productData.stock, 10),
        images: imagePaths,
      },
    });

    logger.info(`Product created: ${product.id} - ${product.name}`);
    return product;
  }

  /**
   * Get all products with pagination and filters
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} Products list with pagination
   */
  async getProducts(query) {
    const { page, limit, skip } = parsePagination(query);
    
    // Build filters
    const where = {
      isActive: true,
    };

    // Category filter
    // Map frontend shorthand (MEN/WOMEN) to Prisma enum values (MENS/WOMENS)
    const CATEGORY_ALIAS = { MEN: 'MENS', WOMEN: 'WOMENS' };
    if (query.category) {
      const raw = query.category.toUpperCase();
      where.category = CATEGORY_ALIAS[raw] || raw;
    } else {
      // Never show thrift items in the regular shop
      where.category = { not: 'THRIFT' };
    }

    // Price range filter
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) {
        where.price.gte = parseFloat(query.minPrice);
      }
      if (query.maxPrice) {
        where.price.lte = parseFloat(query.maxPrice);
      }
    }

    // Search across name and description
    if (query.search) {
      const terms = query.search.trim().split(/\s+/).filter(Boolean);
      where.AND = terms.map((term) => ({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      }));
    }

    // Determine sort order
    let orderBy = { createdAt: 'desc' }; // default: newest
    if (query.sortBy === 'price-low')  orderBy = { price: 'asc' };
    else if (query.sortBy === 'price-high') orderBy = { price: 'desc' };
    else if (query.sortBy === 'oldest') orderBy = { createdAt: 'asc' };

    // Get products with total count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single product by ID
   * @param {String} productId - Product ID
   * @returns {Promise<Object>} Product details
   */
  async getProductById(productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (!product.isActive) {
      throw new NotFoundError('Product not available');
    }

    return product;
  }

  /**
   * Update product (ADMIN only)
   * @param {String} productId - Product ID
   * @param {Object} updateData - Updated product data
   * @param {Array} newImages - New image files (optional)
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(productId, updateData, newImages = []) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Handle numeric fields
    if (updateData.price) {
      updateData.price = parseFloat(updateData.price);
    }
    if (updateData.stock !== undefined) {
      updateData.stock = parseInt(updateData.stock, 10);
    }

    // Upload new images if provided
    if (newImages && newImages.length > 0) {
      const newImagePaths = await imageService.uploadMultiple(newImages, 'products');
      updateData.images = [...product.images, ...newImagePaths];
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    logger.info(`Product updated: ${productId}`);
    return updatedProduct;
  }

  /**
   * Delete product (ADMIN only)
   * Soft delete by setting isActive to false
   * @param {String} productId - Product ID
   * @returns {Promise<Object>} Success message
   */
  async deleteProduct(productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Soft delete
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    // Could also delete images here, but keeping them for potential recovery
    // await imageService.deleteMultiple(product.images);

    logger.info(`Product soft deleted: ${productId}`);
    return { message: 'Product deleted successfully' };
  }

  /**
   * Delete product image (ADMIN only)
   * @param {String} productId - Product ID
   * @param {String} imagePath - Image path to delete
   * @returns {Promise<Object>} Updated product
   */
  async deleteProductImage(productId, imagePath) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (!product.images.includes(imagePath)) {
      throw new BadRequestError('Image not found in product');
    }

    // Remove image from array
    const updatedImages = product.images.filter(img => img !== imagePath);

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { images: updatedImages },
    });

    // Delete the file
    await imageService.delete(imagePath);

    logger.info(`Product image deleted: ${productId} - ${imagePath}`);
    return updatedProduct;
  }

  /**
   * Check and update stock
   * @param {String} productId - Product ID
   * @param {Number} quantity - Quantity to deduct
   * @returns {Promise<Boolean>} Success status
   */
  async checkAndUpdateStock(productId, quantity) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.stock < quantity) {
      throw new BadRequestError(`Insufficient stock. Only ${product.stock} items available.`);
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        stock: product.stock - quantity,
      },
    });

    return true;
  }
}

module.exports = new ProductService();
