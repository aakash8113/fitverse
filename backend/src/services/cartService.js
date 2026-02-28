// Cart Service
// Business logic for shopping cart management

const prisma = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../config/logger');

class CartService {
  /**
   * Get or create user's cart
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Cart with items
   */
  async getOrCreateCart(userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Create cart if doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    // Calculate cart total
    const cartTotal = cart.items.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0);

    return {
      ...cart,
      total: cartTotal,
    };
  }

  /**
   * Add item to cart
   * @param {String} userId - User ID
   * @param {String} productId - Product ID
   * @param {Number} quantity - Quantity to add
   * @returns {Promise<Object>} Updated cart
   */
  async addToCart(userId, productId, quantity) {
    // Verify product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestError('Product is not available');
    }

    if (product.stock < quantity) {
      throw new BadRequestError(`Only ${product.stock} items available in stock`);
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity if total doesn't exceed stock
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > product.stock) {
        throw new BadRequestError(`Cannot add more. Only ${product.stock} items available.`);
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    logger.info(`Item added to cart: User ${userId}, Product ${productId}`);

    // Return updated cart
    return await this.getOrCreateCart(userId);
  }

  /**
   * Update cart item quantity
   * @param {String} userId - User ID
   * @param {String} cartItemId - Cart item ID
   * @param {Number} quantity - New quantity
   * @returns {Promise<Object>} Updated cart
   */
  async updateCartItem(userId, cartItemId, quantity) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    // Verify cart belongs to user
    if (cartItem.cart.userId !== userId) {
      throw new BadRequestError('Unauthorized');
    }

    // Check stock
    if (quantity > cartItem.product.stock) {
      throw new BadRequestError(`Only ${cartItem.product.stock} items available`);
    }

    // Update quantity
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    logger.info(`Cart item updated: ${cartItemId}`);

    return await this.getOrCreateCart(userId);
  }

  /**
   * Remove item from cart
   * @param {String} userId - User ID
   * @param {String} cartItemId - Cart item ID
   * @returns {Promise<Object>} Updated cart
   */
  async removeFromCart(userId, cartItemId) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    // Verify cart belongs to user
    if (cartItem.cart.userId !== userId) {
      throw new BadRequestError('Unauthorized');
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    logger.info(`Item removed from cart: ${cartItemId}`);

    return await this.getOrCreateCart(userId);
  }

  /**
   * Clear entire cart
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Empty cart
   */
  async clearCart(userId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    logger.info(`Cart cleared: User ${userId}`);

    return await this.getOrCreateCart(userId);
  }
}

module.exports = new CartService();
