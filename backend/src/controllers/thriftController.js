// Thrift Controller — User-facing endpoints
// Handles listing submissions, image uploads, and tracking

const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../config/logger');

// Round a value to 2 decimal places — avoids floating point drift (e.g. 200 → 199.97)
const toMoney = (val) => val != null && val !== '' ? Math.round(parseFloat(val) * 100) / 100 : null;

// ============================================
// CREATE LISTING (with multiple items + images)
// POST /api/thrift/listings
// ============================================
const createListing = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { pickupAddressId } = req.body;

  // Items come as a JSON string in the `items` field (FormData)
  let itemsData;
  try {
    itemsData = typeof req.body.items === 'string'
      ? JSON.parse(req.body.items)
      : req.body.items;
  } catch {
    throw new BadRequestError('Invalid items data — must be valid JSON');
  }

  if (!Array.isArray(itemsData) || itemsData.length === 0) {
    throw new BadRequestError('At least one item is required');
  }

  // Group uploaded files by item index  (field names: item_images_0, item_images_1, ...)
  const filesByIndex = {};
  if (req.files && Array.isArray(req.files)) {
    req.files.forEach((file) => {
      const match = file.fieldname.match(/^item_images_(\d+)/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (!filesByIndex[idx]) filesByIndex[idx] = [];
        filesByIndex[idx].push(file.path); // file.path = Cloudinary URL
      }
    });
  }

  // Create the listing + all items in one transaction
  const listing = await prisma.thriftListing.create({
    data: {
      userId,
      pickupAddressId: pickupAddressId || null,
      items: {
        create: itemsData.map((item, idx) => ({
          userId,
          name: item.name,
          brand: item.brand || null,
          gender: item.gender,
          wearType: item.wearType,
          category: item.category,
          subCategory: item.subCategory || null,
          size: item.size || null,
          condition: item.condition,
          description: item.description,
          originalPrice: item.originalPrice ? toMoney(item.originalPrice) : null,
          images: filesByIndex[idx] || [],
        })),
      },
    },
    include: {
      items: true,
      pickupAddress: true,
    },
  });

  logger.info(`ThriftListing created: ${listing.id} by user ${userId} with ${listing.items.length} items`);

  res.status(201).json({ success: true, data: listing, message: 'Listing submitted successfully' });
});

// ============================================
// UPLOAD IMAGES FOR A SPECIFIC ITEM
// POST /api/thrift/listings/:listingId/items/:itemId/images
// ============================================
const uploadItemImages = asyncHandler(async (req, res) => {
  const { listingId, itemId } = req.params;
  const userId = req.user.id;

  const item = await prisma.thriftItem.findFirst({
    where: { id: itemId, listingId, userId },
  });
  if (!item) throw new NotFoundError('Item not found');

  if (!req.files || req.files.length === 0) {
    throw new BadRequestError('No images uploaded');
  }

  const newImages = req.files.map((f) => f.path); // f.path = Cloudinary URL
  const allImages = [...item.images, ...newImages].slice(0, 5); // max 5 per item

  const updated = await prisma.thriftItem.update({
    where: { id: itemId },
    data: { images: allImages },
  });

  res.json({ success: true, data: updated });
});

// ============================================
// GET MY LISTINGS
// GET /api/thrift/listings
// ============================================
const getMyListings = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const listings = await prisma.thriftListing.findMany({
    where: { userId },
    include: {
      items: true,
      pickupAddress: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: listings });
});

// ============================================
// GET SINGLE LISTING DETAILS
// GET /api/thrift/listings/:id
// ============================================
const getListingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const listing = await prisma.thriftListing.findFirst({
    where: { id, userId },
    include: { items: true, pickupAddress: true },
  });

  if (!listing) throw new NotFoundError('Listing not found');

  res.json({ success: true, data: listing });
});

// ============================================
// CANCEL PENDING LISTING
// DELETE /api/thrift/listings/:id
// ============================================
const cancelListing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const listing = await prisma.thriftListing.findFirst({
    where: { id, userId },
  });

  if (!listing) throw new NotFoundError('Listing not found');
  if (listing.status !== 'PENDING') {
    throw new BadRequestError('Only pending listings can be cancelled');
  }

  await prisma.thriftListing.delete({ where: { id } });

  logger.info(`ThriftListing ${id} cancelled by user ${userId}`);
  res.json({ success: true, message: 'Listing cancelled successfully' });
});

module.exports = {
  createListing,
  uploadItemImages,
  getMyListings,
  getListingById,
  cancelListing,
};
