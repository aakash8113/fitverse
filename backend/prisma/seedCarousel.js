const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Replace these URLs anytime and rerun: npm run prisma:seed:carousel
const HOME_SLIDES = [
  { imageUrl: 'https://res.cloudinary.com/dw1mjqbbj/image/upload/v1773410507/hero-store_m5o8gu.jpg', altText: 'Home carousel slide 1' },
  { imageUrl: 'https://res.cloudinary.com/dw1mjqbbj/image/upload/v1773410507/carousel_3_rybumg.jpg', altText: 'Home carousel slide 2' },
  { imageUrl: 'https://res.cloudinary.com/dw1mjqbbj/image/upload/v1773410506/carousel_2_csqg4g.jpg', altText: 'Home carousel slide 3' },
  { imageUrl: 'https://res.cloudinary.com/dw1mjqbbj/image/upload/v1773410505/carousel_1_c7gfvg.png', altText: 'Home carousel slide 4' },
];

const SHOP_SLIDES = [
  { imageUrl: 'https://res.cloudinary.com/dw1mjqbbj/image/upload/v1773410606/hero-store_lfvxiz.jpg', altText: 'Shop carousel slide 1' },
  { imageUrl: 'https://res.cloudinary.com/dw1mjqbbj/image/upload/v1773410604/carousel_3_c2uuzc.jpg', altText: 'Shop carousel slide 2' },
  { imageUrl: 'https://res.cloudinary.com/dw1mjqbbj/image/upload/v1773410603/carousel_2_hndyxq.jpg', altText: 'Shop carousel slide 3' },
  { imageUrl: 'https://res.cloudinary.com/dw1mjqbbj/image/upload/v1773410601/carousel_1_ia3mxs.png', altText: 'Shop carousel slide 4' },
];

const normalize = (slides) =>
  slides.map((slide, index) => ({
    imageUrl: String(slide.imageUrl || '').trim(),
    altText: slide.altText ? String(slide.altText).trim() : null,
    sortOrder: Number.isInteger(slide.sortOrder) ? slide.sortOrder : index,
    isActive: slide.isActive !== false,
  })).filter((slide) => slide.imageUrl);

async function replacePlacement(placement, slides) {
  const normalized = normalize(slides);

  await prisma.$transaction(async (tx) => {
    await tx.carouselSlide.deleteMany({ where: { placement } });

    if (normalized.length) {
      await tx.carouselSlide.createMany({
        data: normalized.map((slide) => ({ ...slide, placement })),
      });
    }
  });

  console.log(`Updated ${placement} slides: ${normalized.length}`);
}

async function main() {
  console.log('Seeding carousel slides...');
  await replacePlacement('HOME', HOME_SLIDES);
  await replacePlacement('SHOP', SHOP_SLIDES);
  console.log('Carousel seed completed.');
}

main()
  .catch((err) => {
    console.error('Carousel seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
