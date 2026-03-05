// Coin Routes
// All routes require authentication (protect middleware)

const express = require('express');
const router = express.Router();
const coinController = require('../controllers/coinController');
const { protect } = require('../middlewares/auth');

router.get('/history', protect, coinController.getCoinHistory);

module.exports = router;
