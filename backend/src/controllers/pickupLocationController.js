// Pickup Location Controller — Admin Warehouse Locations for Shiprocket
// Admin manages warehouse pickup locations used as fallback for seller-less products

const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../config/logger');

/**
 * GET /api/admin/pickup-locations
 * Get all admin pickup locations.
 */
const getPickupLocations = asyncHandler(async (req, res) => {
  const locations = await prisma.pickupLocation.findMany({
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return ApiResponse.success(res, 200, locations, 'Pickup locations retrieved');
});

/**
 * POST /api/admin/pickup-locations
 * Create a new admin pickup location.
 */
const createPickupLocation = asyncHandler(async (req, res) => {
  const { name, companyName, address, address2, city, state, pincode, phone, email, isDefault } = req.body;

  if (!name || !address || !city || !state || !pincode || !phone || !email) {
    throw new BadRequestError('Missing required fields: name, address, city, state, pincode, phone, email');
  }

  if (isDefault) {
    await prisma.pickupLocation.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const location = await prisma.pickupLocation.create({
    data: {
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

  return ApiResponse.success(res, 201, location, 'Pickup location created');
});

/**
 * PUT /api/admin/pickup-locations/:id
 * Update an admin pickup location.
 */
const updatePickupLocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, companyName, address, address2, city, state, pincode, phone, email, isDefault } = req.body;

  const existing = await prisma.pickupLocation.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Pickup location not found');

  if (isDefault) {
    await prisma.pickupLocation.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.pickupLocation.update({
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

  return ApiResponse.success(res, 200, updated, 'Pickup location updated');
});

/**
 * DELETE /api/admin/pickup-locations/:id
 * Delete an admin pickup location.
 */
const deletePickupLocation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.pickupLocation.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Pickup location not found');

  await prisma.pickupLocation.delete({ where: { id } });

  return ApiResponse.success(res, 200, null, 'Pickup location deleted');
});

module.exports = {
  getPickupLocations,
  createPickupLocation,
  updatePickupLocation,
  deletePickupLocation,
};