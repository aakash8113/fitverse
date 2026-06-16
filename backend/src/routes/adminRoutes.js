// Admin Routes
// All routes require ADMIN role authentication

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const carouselController = require('../controllers/carouselController');
const pickupLocationController = require('../controllers/pickupLocationController');
const adminUserController = require('../controllers/adminUserController');
const { protect, authorize } = require('../middlewares/auth');

// All admin routes require authentication + ADMIN role
router.use(protect);
router.use(authorize('ADMIN'));

// Dashboard
router.get('/stats', adminController.getDashboardStats);
router.get('/ai-usage', adminController.getAiUsageSummary);

// Orders
router.get('/orders', adminController.getAllOrders);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.get('/users/:id/orders', adminController.getUserOrders);
router.put('/users/:id/block', adminController.blockUser);
router.put('/users/:id/unblock', adminController.unblockUser);
router.put('/users/:id/coins', adminController.adjustUserCoins);
router.put('/users/:id/ai-credits', adminController.adjustUserAiCredits);
router.delete('/users/:id', adminController.deleteUser);

// Carousel management
router.get('/carousels/:placement', carouselController.getAdminSlides);
router.put('/carousels/:placement', carouselController.replaceSlides);

// Thrift requests (listing review workflow)
router.get('/thrift/requests', adminController.getAllThriftListings);
router.get('/thrift/requests/:id', adminController.getThriftListingById);
router.put('/thrift/requests/:id/review', adminController.reviewThriftListing);
router.put('/thrift/requests/:id/offer', adminController.updateThriftOffer); // edit offer after sending
router.put('/thrift/requests/:id/pickup', adminController.markListingPickedUp);

// Individual item management
router.put('/thrift/items/:id/status', adminController.updateThriftItemStatus);
router.post('/thrift/items/:id/list', adminController.listThriftItem);

// Thrift inventory (LISTED / SOLD items)
router.get('/thrift/inventory', adminController.getThriftInventory);
router.delete('/thrift/inventory/:id', adminController.deleteThriftInventoryItem);

// Refurbishment tracking
router.get('/refurbishment', adminController.getRefurbishmentItems);
router.put('/refurbishment/:id', adminController.updateRefurbishmentItem);
router.post('/refurbishment/:id/move-to-inventory', adminController.moveRefurbishmentItemToInventory);

// User Creation (admin creates sellers/businesses with Shiprocket address registration)
router.post('/users/create-seller', authorize('ADMIN'), adminUserController.createSeller);
router.post('/users/create-business', authorize('ADMIN'), adminUserController.createBusiness);

// Pickup Locations (admin warehouse for Shiprocket)
router.get('/pickup-locations', pickupLocationController.getPickupLocations);
router.post('/pickup-locations', pickupLocationController.createPickupLocation);
router.put('/pickup-locations/:id', pickupLocationController.updatePickupLocation);
router.delete('/pickup-locations/:id', pickupLocationController.deletePickupLocation);

module.exports = router;