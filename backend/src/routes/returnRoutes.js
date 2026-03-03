// Return & Replacement Routes

const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const { protect, authorize, requireEmailVerification } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createReturnRequestSchema, updateReturnStatusSchema } = require('../utils/validation');

router.use(protect, requireEmailVerification);

// Customer routes
router.post('/', validate(createReturnRequestSchema), returnController.createReturnRequest);
router.get('/', returnController.getMyReturnRequests);
router.get('/:id', returnController.getReturnRequestById);
router.delete('/:id', returnController.cancelReturnRequest);

// Admin routes
router.get('/admin/all', authorize('ADMIN'), returnController.getAllReturnRequests);
router.patch('/admin/:id', authorize('ADMIN'), validate(updateReturnStatusSchema), returnController.updateReturnRequestStatus);

module.exports = router;
