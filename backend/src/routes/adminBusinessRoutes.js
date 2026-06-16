// Admin Business Routes

const express = require('express');
const router = express.Router();
const adminBusinessController = require('../controllers/adminBusinessController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/businesses', adminBusinessController.getBusinesses);
router.put('/businesses/:id/credits', adminBusinessController.adjustBusinessCredits);

module.exports = router;