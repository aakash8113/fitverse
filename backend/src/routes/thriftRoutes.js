// Thrift Routes — User-facing
// All routes require authentication

const express = require('express');
const router = express.Router();
const thriftController = require('../controllers/thriftController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.use(protect);

// Listings
router.post('/', upload.any(), thriftController.createListing);
router.get('/', thriftController.getMyListings);
router.get('/:id', thriftController.getListingById);
router.delete('/:id', thriftController.cancelListing);

// Item image upload
router.post(
  '/:listingId/items/:itemId/images',
  upload.array('images', 5),
  thriftController.uploadItemImages
);

module.exports = router;
