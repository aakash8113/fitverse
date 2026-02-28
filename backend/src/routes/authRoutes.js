// Auth Routes
// Routes for authentication (signup, login, verify, etc.)

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { authLimiter } = require('../middlewares/security');
const {
  signupSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
} = require('../utils/validation');

// Public routes (with rate limiting)
router.post('/signup', authLimiter, validate(signupSchema), authController.signup);
router.post('/verify-email', authLimiter, validate(verifyOTPSchema), authController.verifyEmail);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/resend-otp', authLimiter, validate(resendOTPSchema), authController.resendOTP);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/change-password', protect, authController.changePassword);

module.exports = router;
