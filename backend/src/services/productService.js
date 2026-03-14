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

    // Parse availableSizes — FormData sends as JSON string or array
    let availableSizes = productData.availableSizes || [];
    if (typeof availableSizes === 'string') {
      try { availableSizes = JSON.parse(availableSizes); } catch { availableSizes = []; }
    }
    if (!Array.isArray(availableSizes)) availableSizes = [];

    // Parse sizeStock — e.g. {"S":4,"M":10,"XL":3}
    let sizeStock = productData.sizeStock || {};
    if (typeof sizeStock === 'string') {
      try { sizeStock = JSON.parse(sizeStock); } catch { sizeStock = {}; }
    }
    sizeStock = Object.fromEntries(
      Object.entries(sizeStock).map(([k, v]) => [k, parseInt(v, 10) || 0])
    );

    const product = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        price: Math.round(parseFloat(productData.price) * 100) / 100,
        sizeStock,
        brand: productData.brand || null,
        gender: productData.gender,
        wearType: productData.wearType,
        category: productData.category,
        subCategory: productData.subCategory || null,
        availableSizes,
        isThrift: productData.isThrift === 'true' || productData.isThrift === true || false,
        thriftCondition: productData.thriftCondition || null,
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

    // ── isThrift flag ────────────────────────────────────────────────────────
    // Only filter by isThrift when explicitly provided.
    // Omitting it (e.g. global search) returns both shop and thrift products.
    if (query.isThrift === 'true' || query.isThrift === true) {
      where.isThrift = true;
    } else if (query.isThrift === 'false' || query.isThrift === false) {
      where.isThrift = false;
    }
    // else: no filter — search across all products

    // ── Gender filter ────────────────────────────────────────────────────────
    if (query.gender) {
      where.gender = query.gender.toUpperCase(); // MENS | WOMENS
    }

    // ── WearType filter ──────────────────────────────────────────────────────
    if (query.wearType) {
      where.wearType = query.wearType.toUpperCase(); // TOPWEAR | BOTTOMWEAR
    }

    // ── Category filter (ClothingCategory) ──────────────────────────────────
    if (query.category) {
      where.category = query.category.toUpperCase(); // TSHIRT | SHIRT | HOODIE | JACKET | JEANS | TROUSER | TRACKPANT | CARGO
    }

    // ── SubCategory filter ───────────────────────────────────────────────────
    if (query.subCategory) {
      where.subCategory = query.subCategory.toUpperCase();
    }

    // ── Size filter — check if size is in availableSizes array ───────────────
    if (query.size) {
      where.availableSizes = { has: query.size };
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

    try {
      // Primary query path
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
    } catch (err) {
      // Fallback keeps storefront usable if strict Prisma query fails due env/schema drift.
      logger.error(`Primary product query failed, using fallback: ${err.message}`);

      const thriftFilter = where.isThrift === true
        ? ' AND "isThrift" = true'
        : where.isThrift === false
          ? ' AND "isThrift" = false'
          : '';

      const fallbackProducts = await prisma.$queryRawUnsafe(
        `SELECT id, name, description, price, brand, images, "isThrift", "isActive", "createdAt", "updatedAt"
         FROM "products"
         WHERE "isActive" = true${thriftFilter}
         ORDER BY "createdAt" DESC
         LIMIT $1 OFFSET $2`,
        limit,
        skip
      );

      const fallbackCountRows = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total
         FROM "products"
         WHERE "isActive" = true${thriftFilter}`
      );

      const total = fallbackCountRows?.[0]?.total || 0;

      const products = fallbackProducts.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        price: row.price,
        brand: row.brand || null,
        gender: null,
        wearType: null,
        category: null,
        subCategory: null,
        availableSizes: [],
        isThrift: !!row.isThrift,
        thriftCondition: null,
        images: Array.isArray(row.images) ? row.images : [],
        sizeStock: {},
        isActive: !!row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

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
    delete updateData.stock; // Replaced by sizeStock

    // Parse sizeStock if provided
    if (updateData.sizeStock !== undefined) {
      if (typeof updateData.sizeStock === 'string') {
        try { updateData.sizeStock = JSON.parse(updateData.sizeStock); } catch { updateData.sizeStock = {}; }
      }
      updateData.sizeStock = Object.fromEntries(
        Object.entries(updateData.sizeStock).map(([k, v]) => [k, parseInt(v, 10) || 0])
      );
    }

    // Parse availableSizes if provided
    if (updateData.availableSizes !== undefined) {
      let sizes = updateData.availableSizes;
      if (typeof sizes === 'string') {
        try { sizes = JSON.parse(sizes); } catch { sizes = []; }
      }
      if (!Array.isArray(sizes)) sizes = [];
      updateData.availableSizes = sizes;
    }

    // Null out empty subCategory
    if (updateData.subCategory === '' || updateData.subCategory === 'null') {
      updateData.subCategory = null;
    }

    // Parse isThrift boolean from string
    if (updateData.isThrift !== undefined) {
      updateData.isThrift = updateData.isThrift === 'true' || updateData.isThrift === true;
    }

    // Null out empty thriftCondition
    if (updateData.thriftCondition === '') {
      updateData.thriftCondition = null;
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
   * Hard delete with dependent cleanup
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

    const linkedThriftItem = await prisma.thriftItem.findFirst({
      where: { listedProductId: productId },
      select: {
        id: true,
        listingId: true,
        images: true,
      },
    });

    const imagesToDelete = [...new Set([...(product.images || []), ...(linkedThriftItem?.images || [])])];

    await prisma.$transaction(async (tx) => {
      if (linkedThriftItem) {
        await tx.thriftItem.delete({ where: { id: linkedThriftItem.id } });

        const remainingItems = await tx.thriftItem.findMany({
          where: { listingId: linkedThriftItem.listingId },
          select: { status: true },
        });

        if (remainingItems.length === 0) {
          await tx.thriftListing.delete({ where: { id: linkedThriftItem.listingId } });
        } else {
          const activeStatuses = remainingItems
            .map((item) => item.status)
            .filter((status) => status !== 'REJECTED');

          let nextListingStatus = 'PENDING';
          if (activeStatuses.length === 0) {
            nextListingStatus = 'REJECTED';
          } else if (activeStatuses.every((status) => ['LISTED', 'SOLD'].includes(status))) {
            nextListingStatus = 'COMPLETED';
          } else if (activeStatuses.some((status) => ['PICKED_UP', 'UNDER_REFURBISHMENT', 'REFURBISHMENT_COMPLETE', 'LISTED', 'SOLD'].includes(status))) {
            nextListingStatus = 'PICKED_UP';
          } else if (activeStatuses.some((status) => status === 'APPROVED')) {
            nextListingStatus = 'APPROVED';
          }

          await tx.thriftListing.update({
            where: { id: linkedThriftItem.listingId },
            data: { status: nextListingStatus },
          });
        }
      }

      await tx.product.delete({ where: { id: productId } });
    });

    await imageService.deleteMultiple(imagesToDelete);

    logger.info(`Product hard deleted: ${productId}`);
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

    await prisma.thriftItem.updateMany({
      where: { listedProductId: productId },
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
