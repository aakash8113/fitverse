// Auth Routes
// Routes for authentication (signup, login, verify, etc.)

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { authLimiter, otpRequestLimiter, otpVerifyLimiter } = require('../middlewares/security');
const {
  signupSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} = require('../utils/validation');

// Public routes (with rate limiting)
router.post('/signup', authLimiter, validate(signupSchema), authController.signup);
router.post('/verify-email', otpVerifyLimiter, validate(verifyOTPSchema), authController.verifyEmail);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/resend-otp', otpRequestLimiter, validate(resendOTPSchema), authController.resendOTP);
router.post('/forgot-password', otpRequestLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', otpVerifyLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, validate(updateProfileSchema), authController.updateProfile);
router.put('/change-password', protect, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
