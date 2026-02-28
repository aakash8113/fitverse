// Address Routes
// Routes for address management

const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { protect, requireEmailVerification } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createAddressSchema,
  updateAddressSchema,
} = require('../utils/validation');

// All address routes require authentication and email verification
router.use(protect, requireEmailVerification);

// Address routes
router.get('/', addressController.getAddresses);
router.get('/:id', addressController.getAddressById);
router.post('/', validate(createAddressSchema), addressController.createAddress);
router.put('/:id', validate(updateAddressSchema), addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

module.exports = router;
