// Review Controller
// Verified-purchase reviews for both Shop and Thrift products

const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/database');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');

const isMissingReviewSchemaError = (error) => {
  if (!error) return false;
  if (error.code === 'P2021' || error.code === 'P2022') return true;
  const raw = `${error.message || ''} ${error.meta?.table || ''} ${error.meta?.column || ''}`.toLowerCase();
  return raw.includes('reviews') || raw.includes('review_helpful');
};

// (Image upload middleware is applied in reviewRoutes.js via upload.review)

// ============================================
// GET /api/reviews/:productId
// Public — returns reviews + aggregate stats
// ============================================
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const page  = Math.max(1, parseInt(req.query.page  || '1'));
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit || '10')));
  const skip  = (page - 1) * limit;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product not found');

  let reviews = [];
  let total = 0;
  let allRatings = [];

  try {
    [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        include: {
          user: { select: { id: true, name: true } },
          helpfulBy: { select: { userId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { productId } }),
    ]);

    // Rating distribution and average
    allRatings = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { rating: true },
    });
  } catch (error) {
    if (!isMissingReviewSchemaError(error)) {
      throw error;
    }
  }

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const found = allRatings.find((r) => r.rating === star);
    return { stars: star, count: found ? found._count.rating : 0 };
  });

  const averageRating = total > 0
    ? distribution.reduce((sum, d) => sum + d.stars * d.count, 0) / total
    : 0;

  // Attach helpful count + flag if current user marked helpful
  const currentUserId = req.user?.id || null;
  const formatted = reviews.map((r) => ({
    id: r.id,
    userId: r.user.id,
    author: r.user.name,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    images: r.images,
    helpfulCount: r.helpfulBy.length,
    markedHelpful: currentUserId ? r.helpfulBy.some((h) => h.userId === currentUserId) : false,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  res.json({
    success: true,
    data: {
      reviews: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews: total,
        distribution,
      },
    },
  });
});

// ============================================
// POST /api/reviews/:productId
// Auth required — verified purchasers only
// Supports optional image uploads (multipart/form-data)
// ============================================
const createOrUpdateReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;
  const { rating, title, comment } = req.body;

  if (!rating || !comment) throw new BadRequestError('Rating and comment are required');
  const ratingNum = parseInt(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new BadRequestError('Rating must be between 1 and 5');
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product not found');

  // Verify purchase — user must have a DELIVERED order containing this product
  const purchasedOrder = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId, status: 'DELIVERED' },
    },
  });
  if (!purchasedOrder) {
    throw new ForbiddenError('You can only review products you have purchased and received');
  }

  // Handle uploaded images
  const newImages = (req.files || []).map((f) => f.path);

  // Check if review already exists
  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
  });

  let review;
  if (existing) {
    // Update — merge old images with new ones (keep old if no new uploads)
    const images = newImages.length > 0 ? newImages : existing.images;
    review = await prisma.review.update({
      where: { id: existing.id },
      data: { rating: ratingNum, title: title || null, comment, images },
      include: { user: { select: { id: true, name: true } }, helpfulBy: { select: { userId: true } } },
    });
  } else {
    review = await prisma.review.create({
      data: { productId, userId, rating: ratingNum, title: title || null, comment, images: newImages },
      include: { user: { select: { id: true, name: true } }, helpfulBy: { select: { userId: true } } },
    });
  }

  res.status(existing ? 200 : 201).json({
    success: true,
    data: {
      id: review.id,
      userId: review.user.id,
      author: review.user.name,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images,
      helpfulCount: review.helpfulBy.length,
      markedHelpful: false,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    },
    message: existing ? 'Review updated' : 'Review submitted',
  });
});

// ============================================
// DELETE /api/reviews/:reviewId
// Auth required — own review only
// ============================================
const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError('Review not found');
  if (review.userId !== userId && req.user.role !== 'ADMIN') {
    throw new ForbiddenError('You can only delete your own reviews');
  }

  await prisma.review.delete({ where: { id: reviewId } });
  res.json({ success: true, message: 'Review deleted' });
});

// ============================================
// POST /api/reviews/:reviewId/helpful
// Auth required — toggle helpful vote
// ============================================
const toggleHelpful = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError('Review not found');
  if (review.userId === userId) throw new BadRequestError('You cannot vote on your own review');

  const existing = await prisma.reviewHelpful.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
  });

  if (existing) {
    await prisma.reviewHelpful.delete({ where: { id: existing.id } });
    res.json({ success: true, marked: false });
  } else {
    await prisma.reviewHelpful.create({ data: { reviewId, userId } });
    res.json({ success: true, marked: true });
  }
});

// ============================================
// GET /api/reviews/:productId/my
// Auth required — returns current user's review for this product
// ============================================
const getMyReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  const review = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
    include: { helpfulBy: { select: { userId: true } } },
  });

  res.json({
    success: true,
    data: review ? {
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images,
      helpfulCount: review.helpfulBy.length,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    } : null,
  });
});

// ============================================
// Check if user has purchased a product
// GET /api/reviews/:productId/can-review
// ============================================
const canReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  const purchasedOrder = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId, status: 'DELIVERED' },
    },
  });

  res.json({ success: true, data: { canReview: !!purchasedOrder } });
});

module.exports = {
  getProductReviews,
  createOrUpdateReview,
  deleteReview,
  toggleHelpful,
  getMyReview,
  canReview,
};
