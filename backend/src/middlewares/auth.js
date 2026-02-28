// Authentication Middleware
// JWT verification and role-based access control

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verify JWT Token and attach user to request
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    throw new UnauthorizedError('Not authorized, no token provided');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from database (excluding password and OTP fields)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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
      throw new UnauthorizedError('User not found');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expired');
    }
    throw error;
  }
});

/**
 * Check if user has ADMIN role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Not authorized, please login');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `User role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};

/**
 * Check if email is verified
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Not authorized, please login');
  }

  if (!req.user.isEmailVerified) {
    throw new ForbiddenError('Please verify your email first');
  }

  next();
};

module.exports = {
  protect,
  authorize,
  requireEmailVerification,
};
