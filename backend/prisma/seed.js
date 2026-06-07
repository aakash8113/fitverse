require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating users only...\n');

  // Optional safety: prevent duplicates
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(`⚠️  Users already exist (${existingUsers}). Seed aborted.`);
    return;
  }

  const adminPassword = await bcrypt.hash('admin123', 12);
  const userPassword = await bcrypt.hash('user123', 12);
  const sellerPassword = await bcrypt.hash('seller123', 12);

  // Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@fitverse.com',
      password: adminPassword,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  // User 1
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

  // User 2
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

  // Seller
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

  // Sample seller products
  await prisma.product.createMany({
    data: [
      {
        name: 'Classic Fit Polo T-Shirt',
        description: 'Premium cotton polo t-shirt with a relaxed fit. Perfect for casual and semi-formal occasions.',
        price: 1299,
        brand: 'Urban Threads',
        gender: 'MENS',
        wearType: 'TOPWEAR',
        category: 'TSHIRT',
        subCategory: 'POLO',
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
        sizeStock: { S: 15, M: 25, L: 30, XL: 20, XXL: 10 },
        images: [],
        isThrift: false,
        sellerId: seller.id,
      },
      {
        name: 'Slim Fit Denim Jeans',
        description: 'Modern slim fit denim jeans with stretch comfort. Dark blue wash.',
        price: 1899,
        brand: 'Denim Co.',
        gender: 'MENS',
        wearType: 'BOTTOMWEAR',
        category: 'JEANS',
        subCategory: 'SKINNY',
        availableSizes: ['28', '30', '32', '34', '36'],
        sizeStock: { '28': 10, '30': 20, '32': 25, '34': 15, '36': 10 },
        images: [],
        isThrift: false,
        sellerId: seller.id,
      },
      {
        name: 'Floral Print Summer Dress',
        description: 'Lightweight floral print dress with adjustable straps. Made from breathable cotton.',
        price: 2499,
        brand: 'Bloom Fashion',
        gender: 'WOMENS',
        wearType: 'TOPWEAR',
        category: 'TSHIRT',
        subCategory: 'OVERSIZED',
        availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
        sizeStock: { XS: 8, S: 15, M: 20, L: 12, XL: 8 },
        images: [],
        isThrift: false,
        sellerId: seller.id,
      },
      {
        name: 'Cotton Linen Trouser',
        description: 'Comfortable cotton-linen blend trousers with elastic waistband. Beige color.',
        price: 1599,
        brand: 'ComfortWear',
        gender: 'WOMENS',
        wearType: 'BOTTOMWEAR',
        category: 'TROUSER',
        availableSizes: ['28', '30', '32', '34', '36'],
        sizeStock: { '28': 12, '30': 18, '32': 22, '34': 14, '36': 8 },
        images: [],
        isThrift: false,
        sellerId: seller.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('\n✅ Users & seller products created successfully');
  console.log('---------------------------');
  console.log(`Admin:  admin@fitverse.com / admin123`);
  console.log(`User1:  john@example.com / user123`);
  console.log(`User2:  jane@example.com / user123`);
  console.log(`Seller: seller@fitverse.com / seller123`);
  console.log(`\n✅ 4 sample products created for seller (Rahul Verma)`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });