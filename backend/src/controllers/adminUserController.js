// Admin User Controller — Create sellers & businesses with Shiprocket pickup address registration
const prisma = require('../config/database');
const bcrypt = require('bcrypt');
const shippingService = require('../services/shippingService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { BadRequestError } = require('../utils/errors');
const logger = require('../config/logger');

/**
 * POST /api/admin/users/create-seller
 * Admin creates a new seller user with a pickup address registered on Shiprocket.
 * The pickup location nickname follows: seller_{sellerId}
 */
const createSeller = asyncHandler(async (req, res) => {
  const { name, email, phone, password, pickupAddress } = req.body;

  if (!name || !email || !password) {
    throw new BadRequestError('name, email, and password are required');
  }
  if (!pickupAddress || !pickupAddress.address || !pickupAddress.city || !pickupAddress.state || !pickupAddress.pincode || !pickupAddress.phone) {
    throw new BadRequestError('pickupAddress with address, city, state, pincode, and phone is required');
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new BadRequestError('A user with this email already exists');
  }

  // Create the seller user
  const hash = await bcrypt.hash(password, 12);
  const seller = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || pickupAddress.phone,
      password: hash,
      role: 'SELLER',
      isEmailVerified: true,
    },
  });

  // Save pickup address in our DB
  // Shiprocket pickup location will be auto-created via vendor_details when order is sent
  await prisma.pickupAddress.create({
    data: {
      sellerId: seller.id,
      name: pickupAddress.name || 'Main Warehouse',
      companyName: pickupAddress.companyName || null,
      address: pickupAddress.address,
      address2: pickupAddress.address2 || null,
      city: pickupAddress.city,
      state: pickupAddress.state,
      pincode: pickupAddress.pincode,
      phone: pickupAddress.phone,
      email: pickupAddress.email || seller.email,
      isDefault: true,
    },
  });

  logger.info(`Seller created with pickup address: ${seller.email}`);

  return ApiResponse.success(res, 201, {
    id: seller.id,
    name: seller.name,
    email: seller.email,
    role: 'SELLER',
  }, 'Seller created successfully. Pickup address will be registered with Shiprocket on first order.');
});

/**
 * POST /api/admin/users/create-business
 * Admin creates a new business user.
 */
const createBusiness = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    throw new BadRequestError('name, email, and password are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new BadRequestError('A user with this email already exists');
  }

  const hash = await bcrypt.hash(password, 12);
  const business = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      password: hash,
      role: 'BUSINESS',
      isEmailVerified: true,
      businessCredits: 0,
    },
  });

  logger.info(`Business created: ${business.email}`);
  return ApiResponse.success(res, 201, {
    id: business.id,
    name: business.name,
    email: business.email,
    role: 'BUSINESS',
  }, 'Business created successfully');
});

module.exports = {
  createSeller,
  createBusiness,
};