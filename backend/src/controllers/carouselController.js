const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { BadRequestError } = require('../utils/errors');

const VALID_PLACEMENTS = ['HOME', 'SHOP'];

const parsePlacement = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (!VALID_PLACEMENTS.includes(normalized)) {
    throw new BadRequestError('placement must be HOME or SHOP');
  }
  return normalized;
};

const sanitizeSlides = (slides) => {
  if (!Array.isArray(slides) || slides.length === 0) {
    throw new BadRequestError('slides must be a non-empty array');
  }

  const seenOrders = new Set();

  return slides.map((slide, index) => {
    const imageUrl = String(slide?.imageUrl || '').trim();
    const sortOrder = Number.isInteger(slide?.sortOrder) ? slide.sortOrder : index;

    if (!imageUrl) {
      throw new BadRequestError('Each slide must include imageUrl');
    }

    if (seenOrders.has(sortOrder)) {
      throw new BadRequestError('sortOrder values must be unique within a placement');
    }
    seenOrders.add(sortOrder);

    return {
      imageUrl,
      altText: slide?.altText ? String(slide.altText).trim() : null,
      sortOrder,
      isActive: slide?.isActive !== false,
    };
  });
};

// Public: GET /api/carousels/:placement
const getPublicSlides = asyncHandler(async (req, res) => {
  const placement = parsePlacement(req.params.placement);

  const slides = await prisma.carouselSlide.findMany({
    where: { placement, isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { imageUrl: true, altText: true, sortOrder: true },
  });

  res.json({ success: true, data: slides });
});

// Admin: GET /api/admin/carousels/:placement
const getAdminSlides = asyncHandler(async (req, res) => {
  const placement = parsePlacement(req.params.placement);

  const slides = await prisma.carouselSlide.findMany({
    where: { placement },
    orderBy: { sortOrder: 'asc' },
  });

  res.json({ success: true, data: slides });
});

// Admin: PUT /api/admin/carousels/:placement
// Replaces the whole placement list in one call for simple admin workflows.
const replaceSlides = asyncHandler(async (req, res) => {
  const placement = parsePlacement(req.params.placement);
  const slides = sanitizeSlides(req.body?.slides);

  await prisma.$transaction(async (tx) => {
    await tx.carouselSlide.deleteMany({ where: { placement } });
    await tx.carouselSlide.createMany({
      data: slides.map((slide) => ({ ...slide, placement })),
    });
  });

  const updated = await prisma.carouselSlide.findMany({
    where: { placement },
    orderBy: { sortOrder: 'asc' },
  });

  res.json({ success: true, message: 'Carousel slides updated', data: updated });
});

module.exports = {
  getPublicSlides,
  getAdminSlides,
  replaceSlides,
};
