// Thrift Routes — User-facing
// All routes require authentication

const express = require('express');
const router = express.Router();
const thriftController = require('../controllers/thriftController');
const { protect, requireEmailVerification } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Public stats for thrift landing page hero
router.get('/stats', thriftController.getPublicThriftStats);

router.use(protect);

// Listings
router.post('/', requireEmailVerification, upload.thrift.any(), thriftController.createListing); // uploads to fitverse/thrift on Cloudinary
router.get('/', thriftController.getMyListings);
router.get('/:id', thriftController.getListingById);
router.delete('/:id', requireEmailVerification, thriftController.cancelListing);
router.post('/:id/respond', requireEmailVerification, thriftController.respondToOffer); // user: accept / decline / call

// Item image upload
router.post(
  '/:listingId/items/:itemId/images',
  requireEmailVerification,
  upload.thrift.array('images', 5),
  thriftController.uploadItemImages
);

module.exports = router;
