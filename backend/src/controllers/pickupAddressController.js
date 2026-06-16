// Pickup Address Controller — Seller Pickup Addresses for Shiprocket
// Sellers manage their own pickup addresses that Shiprocket uses for pickup

const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const logger = require('../config/logger');

/**
 * GET /api/seller/pickup-addresses
 * Get all pickup addresses for the logged-in seller.
 */
const getMyPickupAddresses = asyncHandler(async (req, res) => {
  const addresses = await prisma.pickupAddress.findMany({
    where: { sellerId: req.user.id, isActive: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return ApiResponse.success(res, 200, addresses, 'Pickup addresses retrieved');
});

/**
 * POST /api/seller/pickup-addresses
 * Create a new pickup address for the seller.
 * Body: { name, companyName?, address, address2?, city, state, pincode, phone, email, isDefault? }
 */
const createPickupAddress = asyncHandler(async (req, res) => {
  const { name, companyName, address, address2, city, state, pincode, phone, email, isDefault } = req.body;

  if (!name || !address || !city || !state || !pincode || !phone || !email) {
    throw new BadRequestError('Missing required fields: name, address, city, state, pincode, phone, email');
  }

  // If setting as default, unset any existing default first
  if (isDefault) {
    await prisma.pickupAddress.updateMany({
      where: { sellerId: req.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const pickupAddress = await prisma.pickupAddress.create({
    data: {
      sellerId: req.user.id,
      name,
      companyName: companyName || null,
      address,
      address2: address2 || null,
      city,
      state,
      pincode,
      phone,
      email,
      isDefault: isDefault || false,
    },
  });

  logger.info(`Pickup address created for seller ${req.user.id}: ${name}`);
  return ApiResponse.success(res, 201, pickupAddress, 'Pickup address created');
});

/**
 * PUT /api/seller/pickup-addresses/:id
 * Update a pickup address.
 */
const updatePickupAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, companyName, address, address2, city, state, pincode, phone, email, isDefault } = req.body;

  const existing = await prisma.pickupAddress.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Pickup address not found');
  if (existing.sellerId !== req.user.id) throw new ForbiddenError('Unauthorized');

  // If setting as default, unset existing defaults
  if (isDefault) {
    await prisma.pickupAddress.updateMany({
      where: { sellerId: req.user.id, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.pickupAddress.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      companyName: companyName !== undefined ? companyName : existing.companyName,
      address: address ?? existing.address,
      address2: address2 !== undefined ? address2 : existing.address2,
      city: city ?? existing.city,
      state: state ?? existing.state,
      pincode: pincode ?? existing.pincode,
      phone: phone ?? existing.phone,
      email: email ?? existing.email,
      isDefault: isDefault ?? existing.isDefault,
    },
  });

  return ApiResponse.success(res, 200, updated, 'Pickup address updated');
});

/**
 * DELETE /api/seller/pickup-addresses/:id
 * Soft-delete (deactivate) a pickup address.
 */
const deletePickupAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.pickupAddress.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Pickup address not found');
  if (existing.sellerId !== req.user.id) throw new ForbiddenError('Unauthorized');

  await prisma.pickupAddress.update({
    where: { id },
    data: { isActive: false, isDefault: false },
  });

  return ApiResponse.success(res, 200, null, 'Pickup address deleted');
});

module.exports = {
  getMyPickupAddresses,
  createPickupAddress,
  updatePickupAddress,
  deletePickupAddress,
};