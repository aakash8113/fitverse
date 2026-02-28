// Admin Routes
// All routes require ADMIN role authentication

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

// All admin routes require authentication + ADMIN role
router.use(protect);
router.use(authorize('ADMIN'));

// Dashboard
router.get('/stats', adminController.getDashboardStats);

// Orders
router.get('/orders', adminController.getAllOrders);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.get('/users/:id/orders', adminController.getUserOrders);
router.put('/users/:id/block', adminController.blockUser);
router.put('/users/:id/unblock', adminController.unblockUser);

// Thrift & AI routes — placeholder (returns 501 until fully implemented)
router.get('/thrift/requests', (req, res) => res.json({ success: false, message: 'Thrift request feature not yet implemented', data: [] }));
router.put('/thrift/requests/:id/status', (req, res) => res.json({ success: false, message: 'Thrift request feature not yet implemented' }));
router.get('/refurbishment', (req, res) => res.json({ success: false, message: 'Refurbishment feature not yet implemented', data: [] }));
router.put('/refurbishment/:id', (req, res) => res.json({ success: false, message: 'Not yet implemented' }));
router.post('/refurbishment/:id/move-to-inventory', (req, res) => res.json({ success: false, message: 'Not yet implemented' }));
router.get('/thrift/inventory', (req, res) => res.json({ success: false, message: 'Thrift inventory not yet implemented', data: [] }));
router.put('/thrift/inventory/:id', (req, res) => res.json({ success: false, message: 'Not yet implemented' }));
router.delete('/thrift/inventory/:id', (req, res) => res.json({ success: false, message: 'Not yet implemented' }));
router.get('/ai/stats', (req, res) => res.json({ success: false, message: 'AI monitoring not yet implemented', data: null }));
router.put('/ai/maintenance', (req, res) => res.json({ success: true, message: 'AI maintenance toggle acknowledged' }));

module.exports = router;
