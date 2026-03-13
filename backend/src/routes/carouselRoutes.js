const express = require('express');
const router = express.Router();
const carouselController = require('../controllers/carouselController');

router.get('/:placement', carouselController.getPublicSlides);

module.exports = router;
