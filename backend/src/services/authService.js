// Authentication Service
// Business logic for user authentication

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const config = require('../config/env');
const otpService = require('./otpService');
const emailService = require('./emailService');
const { ConflictError, UnauthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');
const { sanitizeUser, isOTPExpired } = require('../utils/helpers');
const logger = require('../config/logger');

const OTP_MAX_ATTEMPTS = 5;
const OTP_ATTEMPT_WINDOW_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const otpAttempts = new Map();

const attemptKey = (purpose, email) => `${purpose}:${String(email || '').toLowerCase()}`;

const clearOtpAttempts = (purpose, email) => {
  otpAttempts.delete(attemptKey(purpose, email));
};

const ensureOtpAttemptsAllowed = (purpose, email) => {
  const key = attemptKey(purpose, email);
  const now = Date.now();
  const state = otpAttempts.get(key);
  if (!state) return;

  if (state.windowEndsAt <= now) {
    otpAttempts.delete(key);
    return;
  }

  if (state.count >= OTP_MAX_ATTEMPTS) {
    throw new BadRequestError('Too many invalid OTP attempts. Please request a new OTP.');
  }
};

const registerOtpFailure = (purpose, email) => {
  const key = attemptKey(purpose, email);
  const now = Date.now();
  const state = otpAttempts.get(key);

  if (!state || state.windowEndsAt <= now) {
    otpAttempts.set(key, {
      count: 1,
      windowEndsAt: now + OTP_ATTEMPT_WINDOW_MS,
    });
    return 1;
  }

  state.count += 1;
  otpAttempts.set(key, state);
  return state.count;
};

const ensureOtpSendCooldown = (user) => {
  if (!user?.emailOTP || !user?.otpExpiresAt) return;
  if (isOTPExpired(user.otpExpiresAt)) return;

  const otpIssuedAt = new Date(user.otpExpiresAt).getTime() - OTP_ATTEMPT_WINDOW_MS;
  const elapsed = Date.now() - otpIssuedAt;

  if (elapsed < OTP_RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
    throw new BadRequestError(`Please wait ${waitSeconds}s before requesting another OTP`);
  }
};

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

    // DEV: log OTP to console so it's visible without email setup
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n[DEV] OTP for ${email}: ${otp}\n`);
    }

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
    await otpService.sendEmailOTP(email, otp, name);

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
    ensureOtpAttemptsAllowed('verify', email);

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
      clearOtpAttempts('verify', email);
      throw new BadRequestError('OTP expired. Please request a new one.');
    }

    if (user.emailOTP !== otp) {
      const failures = registerOtpFailure('verify', email);
      if (failures >= OTP_MAX_ATTEMPTS) {
        await prisma.user.update({
          where: { email },
          data: { emailOTP: null, phoneOTP: null, otpExpiresAt: null },
        });
        clearOtpAttempts('verify', email);
        throw new BadRequestError('Too many invalid OTP attempts. Please request a new OTP.');
      }
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

    clearOtpAttempts('verify', email);

    logger.info(`Email verified: ${email}`);

    // Fire-and-forget welcome email
    emailService
      .sendWelcomeEmail(email, user.name)
      .catch((err) => logger.error(`Welcome email failed: ${err.message}`));

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

    ensureOtpSendCooldown(user);

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

    // Send new OTP via email (uses "New verification code" template)
    await otpService.resendEmailOTP(email, otp, user.name);

    clearOtpAttempts('verify', email);

    logger.info(`OTP resent to: ${email}`);

    return {
      message: 'OTP sent to your email',
    };
  }

  /**
   * Request password reset OTP
   * @param {String} email - User email
   * @returns {Promise<Object>} Success message
   */
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    const genericMessage = 'If an account exists, an OTP has been sent to the registered email';

    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return { message: genericMessage };
    }

    if (!user.isEmailVerified) {
      return { message: genericMessage };
    }

    ensureOtpSendCooldown(user);

    const { otp, expiresAt } = otpService.generateOTPWithExpiry();

    await prisma.user.update({
      where: { email },
      data: {
        emailOTP: otp,
        otpExpiresAt: expiresAt,
      },
    });

    await otpService.resendEmailOTP(email, otp, user.name);

    clearOtpAttempts('reset', email);

    logger.info(`Password reset OTP sent: ${email}`);

    return { message: genericMessage };
  }

  /**
   * Reset password using OTP
   * @param {String} email - User email
   * @param {String} otp - 6 digit OTP
   * @param {String} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  async resetPassword(email, otp, newPassword) {
    ensureOtpAttemptsAllowed('reset', email);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestError('Invalid email or OTP');
    }

    if (!user.emailOTP || !user.otpExpiresAt) {
      throw new BadRequestError('No reset OTP found. Please request a new OTP.');
    }

    if (isOTPExpired(user.otpExpiresAt)) {
      clearOtpAttempts('reset', email);
      throw new BadRequestError('OTP expired. Please request a new one.');
    }

    if (user.emailOTP !== otp) {
      const failures = registerOtpFailure('reset', email);
      if (failures >= OTP_MAX_ATTEMPTS) {
        await prisma.user.update({
          where: { email },
          data: { emailOTP: null, phoneOTP: null, otpExpiresAt: null },
        });
        clearOtpAttempts('reset', email);
        throw new BadRequestError('Too many invalid OTP attempts. Please request a new OTP.');
      }
      throw new BadRequestError('Invalid email or OTP');
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('Password must be at least 8 characters');
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashed,
        emailOTP: null,
        phoneOTP: null,
        otpExpiresAt: null,
      },
    });

    clearOtpAttempts('reset', email);

    logger.info(`Password reset successful: ${email}`);

    return { message: 'Password reset successful. Please login with your new password.' };
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
        coinBalance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update current user profile
   * @param {String} userId - User ID
   * @param {Object} data - {name, email, phone}
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(userId, data) {
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const phone = data.phone ? String(data.phone).trim() : null;

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundError('User not found');

    if (email !== existing.email) {
      const emailOwner = await prisma.user.findUnique({ where: { email } });
      if (emailOwner && emailOwner.id !== userId) {
        throw new ConflictError('Email already registered');
      }
    }

    if (phone && phone !== existing.phone) {
      const phoneOwner = await prisma.user.findFirst({ where: { phone } });
      if (phoneOwner && phoneOwner.id !== userId) {
        throw new ConflictError('Phone number already registered');
      }
    }

    const emailChanged = email !== existing.email;
    let verificationOtp = null;
    let verificationExpiresAt = null;

    if (emailChanged) {
      const generated = otpService.generateOTPWithExpiry();
      verificationOtp = generated.otp;
      verificationExpiresAt = generated.expiresAt;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone: phone || null,
        ...(emailChanged ? {
          isEmailVerified: false,
          emailOTP: verificationOtp,
          otpExpiresAt: verificationExpiresAt,
        } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        coinBalance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (emailChanged && verificationOtp) {
      try {
        await otpService.resendEmailOTP(email, verificationOtp, name);
      } catch (err) {
        logger.error(`Failed to send verification OTP after email update for ${userId}: ${err.message}`);
      }
      clearOtpAttempts('verify', existing.email);
      clearOtpAttempts('verify', email);
    }

    logger.info(`Profile updated for user: ${userId}`);
    return {
      user: updated,
      message: emailChanged
        ? 'Profile updated. Please verify your new email address with OTP.'
        : 'Profile updated successfully',
    };
  }

  /**
   * Change user password
   * @param {String} userId - User ID
   * @param {Object} data - {currentPassword, newPassword}
   */
  async changePassword(userId, data) {
    const { currentPassword, newPassword } = data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new BadRequestError('Current password is incorrect');

    if (newPassword.length < 8) {
      throw new BadRequestError('Password must be at least 8 characters');
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    logger.info(`Password changed for user: ${userId}`);
    return { message: 'Password updated successfully' };
  }
}

module.exports = new AuthService();
