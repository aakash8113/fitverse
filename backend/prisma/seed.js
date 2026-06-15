require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

const hashApiKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

async function main() {
  console.log('🌱 Seeding database...\n');

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(`⚠️  Users already exist (${existingUsers}). Delete them first if you want to re-seed.`);
    return;
  }

  const adminPassword = await bcrypt.hash('admin123', 12);
  const userPassword = await bcrypt.hash('user123', 12);
  const sellerPassword = await bcrypt.hash('seller123', 12);
  const businessPassword = await bcrypt.hash('business123', 12);

  // ── Admin ──────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@fitverse.com',
      password: adminPassword,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  // ── Regular Users ──────────────────────────────────────────────────
  const user1 = await prisma.user.create({
    data: {
      name: 'Arjun Sharma',
      email: 'john@example.com',
      phone: '+911234567890',
      password: userPassword,
      role: 'USER',
      isEmailVerified: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Priya Singh',
      email: 'jane@example.com',
      phone: '+911987654321',
      password: userPassword,
      role: 'USER',
      isEmailVerified: true,
    },
  });

  // ── Seller ─────────────────────────────────────────────────────────
  const seller = await prisma.user.create({
    data: {
      name: 'Rahul Verma',
      email: 'seller@fitverse.com',
      phone: '+919999888877',
      password: sellerPassword,
      role: 'SELLER',
      isEmailVerified: true,
    },
  });

  // Seller products (REQUESTED status — pending admin approval)
  await prisma.product.createMany({
    data: [
      {
        name: 'Classic Fit Polo T-Shirt',
        description: 'Premium cotton polo t-shirt. Relaxed fit.',
        price: 1299,
        sellerPrice: 1299,
        brand: 'Urban Threads',
        gender: 'MENS', wearType: 'TOPWEAR', category: 'TSHIRT', subCategory: 'POLO',
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
        sizeStock: { S: 15, M: 25, L: 30, XL: 20, XXL: 10 },
        images: [], isThrift: false,
        sellerId: seller.id,
        sellerApprovalStatus: 'APPROVED',
        isActive: true,
      },
      {
        name: 'Slim Fit Denim Jeans',
        description: 'Modern slim fit denim jeans. Dark blue wash.',
        price: 1899,
        sellerPrice: 1500,
        brand: 'Denim Co.',
        gender: 'MENS', wearType: 'BOTTOMWEAR', category: 'JEANS', subCategory: 'SKINNY',
        availableSizes: ['28', '30', '32', '34', '36'],
        sizeStock: { '28': 10, '30': 20, '32': 25, '34': 15, '36': 10 },
        images: [], isThrift: false,
        sellerId: seller.id,
        sellerApprovalStatus: 'APPROVED',
        isActive: true,
      },
      {
        name: 'Floral Print Summer Dress',
        description: 'Lightweight floral dress. Breathable cotton.',
        price: 2499,
        sellerPrice: 2000,
        brand: 'Bloom Fashion',
        gender: 'WOMENS', wearType: 'TOPWEAR', category: 'TSHIRT', subCategory: 'OVERSIZED',
        availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
        sizeStock: { XS: 8, S: 15, M: 20, L: 12, XL: 8 },
        images: [], isThrift: false,
        sellerId: seller.id,
        sellerApprovalStatus: 'REQUESTED',
        isActive: false,
      },
      {
        name: 'Cotton Linen Trouser',
        description: 'Comfortable cotton-linen blend trousers.',
        price: 1599,
        sellerPrice: 1200,
        brand: 'ComfortWear',
        gender: 'WOMENS', wearType: 'BOTTOMWEAR', category: 'TROUSER',
        availableSizes: ['28', '30', '32', '34', '36'],
        sizeStock: { '28': 12, '30': 18, '32': 22, '34': 14, '36': 8 },
        images: [], isThrift: false,
        sellerId: seller.id,
        sellerApprovalStatus: 'REQUESTED',
        isActive: false,
      },
    ],
    skipDuplicates: true,
  });

  // ── Admin Shop Products ────────────────────────────────────────────
  await prisma.product.createMany({
    data: [
      {
        name: 'Essential Crew Neck Tee',
        description: 'Everyday essential crew neck t-shirt. 100% cotton.',
        price: 899,
        brand: 'Fitverse Basics',
        gender: 'MENS', wearType: 'TOPWEAR', category: 'TSHIRT',
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
        sizeStock: { S: 30, M: 50, L: 45, XL: 35, XXL: 20 },
        images: [], isThrift: false, isActive: true,
      },
      {
        name: 'Woven Cargo Pants',
        description: 'Durable woven cargo pants with multiple pockets.',
        price: 2199,
        brand: 'Fitverse Basics',
        gender: 'MENS', wearType: 'BOTTOMWEAR', category: 'CARGO',
        availableSizes: ['28', '30', '32', '34', '36', '38'],
        sizeStock: { '28': 10, '30': 20, '32': 30, '34': 25, '36': 15, '38': 10 },
        images: [], isThrift: false, isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  // ── Business ───────────────────────────────────────────────────────
  const businessKeyRaw = 'fv_test_business_api_key_12345678';
  const businessKeyHash = hashApiKey(businessKeyRaw);
  const businessKeyPrefix = 'fv_test_bus...';

  const business = await prisma.user.create({
    data: {
      name: 'StyleAI Corp',
      email: 'business@fitverse.com',
      password: businessPassword,
      role: 'BUSINESS',
      isEmailVerified: true,
      businessCredits: 500,
    },
  });

  await prisma.businessApiKey.create({
    data: {
      businessId: business.id,
      name: 'Production Key',
      keyHash: businessKeyHash,
      keyPrefix: businessKeyPrefix,
      isActive: true,
    },
  });

  console.log('\n✅ Seed complete!');
  console.log('────────────────────────────────');
  console.log('Test Accounts:');
  console.log('────────────────────────────────');
  console.log(`Admin:    admin@fitverse.com   / admin123`);
  console.log(`User1:    john@example.com     / user123`);
  console.log(`User2:    jane@example.com     / user123`);
  console.log(`Seller:   seller@fitverse.com  / seller123`);
  console.log(`Business: business@fitverse.com/ business123`);
  console.log('');
  console.log('Business API Key for testing:');
  console.log(`  x-api-key: ${businessKeyRaw}`);
  console.log('');
  console.log('Products:');
  console.log('  - 2 admin shop products (live)');
  console.log('  - 2 seller products APPROVED (live)');
  console.log('  - 2 seller products REQUESTED (pending admin approval)');
  console.log('  - Seller gets 4 products total');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });