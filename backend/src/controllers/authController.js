// Authentication Controller
// Handles HTTP requests for authentication

const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  
  return ApiResponse.success(
    res,
    201,
    result.user,
    result.message
  );
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with OTP
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyEmail(email, otp);
  
  return ApiResponse.success(
    res,
    200,
    null,
    result.message
  );
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  
  return ApiResponse.success(
    res,
    200,
    result,
    'Login successful'
  );
});

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to email
 * @access  Public
 */
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.resendOTP(email);
  
  return ApiResponse.success(
    res,
    200,
    null,
    result.message
  );
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send OTP for password reset
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);

  return ApiResponse.success(
    res,
    200,
    null,
    result.message
  );
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using email OTP
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const result = await authService.resetPassword(email, otp, newPassword);

  return ApiResponse.success(
    res,
    200,
    null,
    result.message
  );
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  
  return ApiResponse.success(
    res,
    200,
    user,
    'User profile retrieved'
  );
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const result = await authService.updateProfile(req.user.id, req.body);

  return ApiResponse.success(
    res,
    200,
    result.user,
    result.message
  );
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change current user password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user.id, req.body);
  return ApiResponse.success(res, 200, null, result.message);
});

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate with Google OAuth
 * @access  Public
 */
const googleLogin = asyncHandler(async (req, res) => {
  const { accessToken } = req.body;
  const result = await authService.googleAuth(accessToken);
  
  return ApiResponse.success(
    res,
    200,
    result,
    'Google login successful'
  );
});

module.exports = {
  signup,
  verifyEmail,
  login,
  resendOTP,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  googleLogin,
};
