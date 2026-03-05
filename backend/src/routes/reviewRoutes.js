// Review Routes
// Base: /api/reviews

const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
  getProductReviews,
  createOrUpdateReview,
  deleteReview,
  toggleHelpful,
  getMyReview,
  canReview,
} = require('../controllers/reviewController');

// Public (shows markedHelpful for logged-in users via optionalAuth)
router.get('/:productId', optionalAuth, getProductReviews);

// Auth required
router.get('/:productId/my', protect, getMyReview);
router.get('/:productId/can-review', protect, canReview);
router.post('/:productId', protect, upload.review.array('images', 5), createOrUpdateReview);
router.delete('/:reviewId/delete', protect, deleteReview);
router.post('/:reviewId/helpful', protect, toggleHelpful);

module.exports = router;
