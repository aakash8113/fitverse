// Coupon Service
// Validates and applies coupon codes

const prisma = require('../config/database');
const { BadRequestError } = require('../utils/errors');

class CouponService {
  /**
   * Validates a coupon code against a user's cart items.
   * Returns the discount amount — does NOT apply the coupon yet.
   * Call applyCoupon() inside the order transaction to finalise.
   *
   * @param {String} userId
   * @param {String} couponCode
   * @param {Array}  cartItems  - array of { productId, quantity, product: { price, isThrift, gender, wearType, category } }
   * @returns {{ coupon: Object, discountAmount: Number, eligibleItemsCount: Number }}
   */
  async validateCoupon(userId, couponCode, cartItems) {
    if (!couponCode) throw new BadRequestError('Coupon code is required');

    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase().trim() },
      include: {
        products: { select: { productId: true } },
        blockedUsers: { select: { userId: true } },
      },
    });

    if (!coupon) throw new BadRequestError('Invalid coupon code');
    if (!coupon.isActive) throw new BadRequestError('This coupon is no longer active');

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestError('This coupon is not yet active');
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new BadRequestError('This coupon has expired');
    }
    if (coupon.totalUsageLimit !== null && coupon.usageCount >= coupon.totalUsageLimit) {
      throw new BadRequestError('This coupon has reached its usage limit');
    }

    // Check if this user is explicitly blocked from this coupon
    const isBlocked = coupon.blockedUsers.some((b) => b.userId === userId);
    if (isBlocked) throw new BadRequestError('You are not eligible to use this coupon');

    // Per-user limit check
    const userUsageCount = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsageCount >= coupon.perUserLimit) {
      throw new BadRequestError('You have already used this coupon the maximum number of times');
    }

    // First-order-only check
    if (coupon.isFirstOrderOnly) {
      const previousOrders = await prisma.order.count({
        where: { userId, status: { notIn: ['CANCELLED'] } },
      });
      if (previousOrders > 0) {
        throw new BadRequestError('This coupon is only valid for your first order');
      }
    }

    // Filter eligible items based on applicableTo + scope
    const applicableProductIds = new Set(coupon.products.map((p) => p.productId));

    const eligibleItems = cartItems.filter((item) => {
      const product = item.product;

      // --- applicableTo filter ---
      if (coupon.applicableTo === 'SHOP' && product.isThrift) return false;
      if (coupon.applicableTo === 'THRIFT' && !product.isThrift) return false;

      // --- scope filter ---
      if (coupon.scope === 'ALL') return true;

      if (coupon.scope === 'CATEGORY') {
        const genderOk =
          !coupon.applicableGenders.length ||
          coupon.applicableGenders.includes(product.gender);
        const wearOk =
          !coupon.applicableWearTypes.length ||
          coupon.applicableWearTypes.includes(product.wearType);
        const catOk =
          !coupon.applicableCategories.length ||
          coupon.applicableCategories.includes(product.category);
        return genderOk && wearOk && catOk;
      }

      if (coupon.scope === 'PRODUCT') {
        return applicableProductIds.has(item.productId);
      }

      return false;
    });

    if (eligibleItems.length === 0) {
      throw new BadRequestError('This coupon is not applicable to any items in your cart');
    }

    // Sum of eligible item prices
    const eligibleSubtotal = eligibleItems.reduce((sum, item) => {
      return sum + parseFloat(item.product.price) * item.quantity;
    }, 0);

    // Minimum order amount check (against full cart subtotal)
    const cartSubtotal = cartItems.reduce((sum, item) => {
      return sum + parseFloat(item.product.price) * item.quantity;
    }, 0);
    if (coupon.minOrderAmount && cartSubtotal < parseFloat(coupon.minOrderAmount)) {
      throw new BadRequestError(
        `This coupon requires a minimum order of ₹${parseFloat(coupon.minOrderAmount).toFixed(2)}`
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = eligibleSubtotal * (parseFloat(coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, parseFloat(coupon.maxDiscountAmount));
      }
    } else {
      // FLAT — cannot discount more than the eligible amount
      discountAmount = Math.min(parseFloat(coupon.discountValue), eligibleSubtotal);
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: parseFloat(coupon.discountValue),
        description: coupon.description,
      },
      discountAmount,
      eligibleItemsCount: eligibleItems.length,
    };
  }

  /**
   * Applies a coupon within an active Prisma transaction.
   * Increments usageCount and creates a CouponUsage record.
   *
   * @param {Object} tx       - Prisma transaction client
   * @param {String} couponId
   * @param {String} orderId
   * @param {String} userId
   */
  async applyCoupon(tx, couponId, orderId, userId) {
    await tx.coupon.update({
      where: { id: couponId },
      data: { usageCount: { increment: 1 } },
    });
    await tx.couponUsage.create({
      data: { couponId, orderId, userId },
    });
  }
}

module.exports = new CouponService();
