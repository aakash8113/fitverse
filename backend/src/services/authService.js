// Authentication Service
// Business logic for user authentication

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const config = require('../config/env');
const otpService = require('./otpService');
const { ConflictError, UnauthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');
const { sanitizeUser, isOTPExpired } = require('../utils/helpers');
const logger = require('../config/logger');

class AuthService {
  /**
   * Register new user
   * @param {Object} userData - {name, email, phone, password}
   * @returns {Promise<Object>} User data and message
   */
  async signup(userData) {
    const { name, email, phone, password } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictError('Email already registered');
      }
      if (existingUser.phone === phone) {
        throw new ConflictError('Phone number already registered');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const { otp, expiresAt } = otpService.generateOTPWithExpiry();

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        emailOTP: otp,
        otpExpiresAt: expiresAt,
      },
    });

    // Send OTP via email
    await otpService.sendEmailOTP(email, otp);

    logger.info(`New user registered: ${email}`);

    return {
      user: sanitizeUser(user),
      message: 'OTP sent to your email. Please verify to complete registration.',
    };
  }

  /**
   * Verify email OTP
   * @param {String} email - User email
   * @param {String} otp - OTP code
   * @returns {Promise<Object>} Success message
   */
  async verifyEmail(email, otp) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestError('Email already verified');
    }

    if (!user.emailOTP || !user.otpExpiresAt) {
      throw new BadRequestError('No OTP found. Please request a new one.');
    }

    if (isOTPExpired(user.otpExpiresAt)) {
      throw new BadRequestError('OTP expired. Please request a new one.');
    }

    if (user.emailOTP !== otp) {
      throw new BadRequestError('Invalid OTP');
    }

    // Mark email as verified and clear OTP
    await prisma.user.update({
      where: { email },
      data: {
        isEmailVerified: true,
        emailOTP: null,
        phoneOTP: null,
        otpExpiresAt: null,
      },
    });

    logger.info(`Email verified: ${email}`);

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  /**
   * Login user
   * @param {String} email - User email
   * @param {String} password - User password
   * @returns {Promise<Object>} User data and JWT token
   */
  async login(email, password) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedError('Please verify your email first');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info(`User logged in: ${email}`);

    return {
      user: sanitizeUser(user),
      token,
    };
  }

  /**
   * Resend OTP
   * @param {String} email - User email
   * @returns {Promise<Object>} Success message
   */
  async resendOTP(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestError('Email already verified');
    }

    // Generate new OTP
    const { otp, expiresAt } = otpService.generateOTPWithExpiry();

    // Update user with new OTP
    await prisma.user.update({
      where: { email },
      data: {
        emailOTP: otp,
        otpExpiresAt: expiresAt,
      },
    });

    // Send OTP via email
    await otpService.sendEmailOTP(email, otp);

    logger.info(`OTP resent to: ${email}`);

    return {
      message: 'OTP sent to your email',
    };
  }

  /**
   * Get current user profile
   * @param {String} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}

module.exports = new AuthService();
