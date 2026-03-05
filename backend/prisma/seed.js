// Database Seed Script
// Populates database with sample data for testing
require('dotenv').config({ path: '../.env' });
// Seed file — updated for new gender/wearType/category/subCategory/availableSizes system
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Safety guard — refuse to seed if real products already exist in the database.
  // This prevents accidentally wiping admin-created data on a shared/production DB.
  const existingProductCount = await prisma.product.count();
  if (existingProductCount > 0) {
    console.log(`⚠️  Seed aborted: ${existingProductCount} products already exist in the database.`);
    console.log('   The seed script is meant for fresh/empty databases only.');
    console.log('   If you truly want to reset, manually delete data first via Prisma Studio or Supabase dashboard.');
    return;
  }

  // Clear existing data (safe — only runs on empty DB per guard above)
  console.log('🗑️  Clearing existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.thriftListing.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleared\n');

  // Create Admin User
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@fitverse.com',
      password: adminPassword,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });
  console.log(`✅ Admin created: ${admin.email} (Password: admin123)\n`);

  // Create Test Users
  console.log('👥 Creating test users...');
  const userPassword = await bcrypt.hash('user123', 12);
  
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
  console.log(`✅ Test users created: john@example.com, jane@example.com (Password: user123)\n`);

  // Create Addresses
  console.log('📍 Creating addresses...');
  const address1 = await prisma.address.create({
    data: {
      userId: user1.id,
      name: 'Arjun Sharma',
      phone: '+911234567890',
      addressLine1: '42 MG Road',
      addressLine2: 'Flat 3A',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560001',
      country: 'India',
      isDefault: true,
    },
  });

  const address2 = await prisma.address.create({
    data: {
      userId: user2.id,
      name: 'Priya Singh',
      phone: '+911987654321',
      addressLine1: '18 Linking Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400050',
      country: 'India',
      isDefault: true,
    },
  });
  console.log('✅ Addresses created\n');

  // ── TOPWEAR sizes ──────────────────────────────────────────────────────────
  const TOP_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const TOP_COMMON  = ['S', 'M', 'L', 'XL', 'XXL'];
  // ── BOTTOMWEAR sizes ───────────────────────────────────────────────────────
  const BOT_SIZES  = ['28', '30', '32', '34', '36', '38', '40', '42'];
  const BOT_COMMON = ['28', '30', '32', '34', '36', '38'];

  // Create Products
  console.log('🛍️  Creating products...');
  
  const products = [
    // ─── MEN — TOPWEAR ─────────────────────────────────────────────────────

    {
      name: 'Oversized Graphic Tee',
      description: 'Boxy oversized fit with bold chest graphic print. 100% combed cotton, pre-shrunk for lasting shape. Perfect for streetwear looks.',
      price: 699,
      stock: 60,
      brand: 'FITVERSE',
      gender: 'MENS',
      wearType: 'TOPWEAR',
      category: 'TSHIRT',
      subCategory: 'OVERSIZED',
      availableSizes: TOP_SIZES,
      images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=800&fit=crop'],
    },
    {
      name: 'Classic Polo T-Shirt',
      description: 'Timeless polo collar tee in premium pique fabric. Ribbed collar and cuffs, two-button placket. Smart-casual essential.',
      price: 899,
      stock: 45,
      brand: 'FITVERSE',
      gender: 'MENS',
      wearType: 'TOPWEAR',
      category: 'TSHIRT',
      subCategory: 'POLO',
      availableSizes: TOP_COMMON,
      images: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&h=800&fit=crop'],
    },
    {
      name: 'Drop Shoulder Street Tee',
      description: 'Relaxed drop-shoulder silhouette with extended sleeves. Heavyweight 220 GSM cotton for a premium feel.',
      price: 799,
      stock: 50,
      brand: 'FITVERSE',
      gender: 'MENS',
      wearType: 'TOPWEAR',
      category: 'TSHIRT',
      subCategory: 'DROP_SHOULDER',
      availableSizes: TOP_SIZES,
      images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=800&fit=crop'],
    },
    {
      name: 'Floral Printed Shirt',
      description: 'Vibrant all-over floral print on a lightweight cotton-linen blend. Perfect for vacations and casual outings.',
      price: 1299,
      stock: 30,
      brand: 'FITVERSE',
      gender: 'MENS',
      wearType: 'TOPWEAR',
      category: 'SHIRT',
      subCategory: 'PRINTED',
      availableSizes: TOP_COMMON,
      images: ['https://images.unsplash.com/photo-1608744882201-52a7f7f3dd60?w=600&h=800&fit=crop'],
    },
    {
      name: 'Solid Oxford Shirt',
      description: 'Classic Oxford weave shirt in a clean solid colour. Button-down collar, chest pocket, slim fit. A wardrobe staple.',
      price: 1199,
      stock: 40,
      brand: 'FITVERSE',
      gender: 'MENS',
      wearType: 'TOPWEAR',
      category: 'SHIRT',
      subCategory: 'PLAIN',
      availableSizes: TOP_COMMON,
      images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop'],
    },
    {
      name: 'Men\'s Fleece Hoodie',
      description: 'Super-soft fleece hoodie with kangaroo pocket and adjustable drawstring. Ideal for winters and workouts.',
      price: 1499,
      stock: 35,
      brand: 'FITVERSE',
      gender: 'MENS',
      wearType: 'TOPWEAR',
      category: 'HOODIE',
      subCategory: null,
      availableSizes: TOP_SIZES,
      images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=800&fit=crop'],
    },
    {
      name: 'Bomber Jacket',
      description: 'Lightweight ribbed-collar bomber with a clean minimal aesthetic. Water-resistant shell, inner mesh lining.',
      price: 2499,
      stock: 20,
      brand: 'FITVERSE',
      gender: 'MENS',
      wearType: 'TOPWEAR',
      category: 'JACKET',
      subCategory: null,
      availableSizes: ['S', 'M', 'L', 'XL'],
      images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop'],
    },

    // ─── MEN — BOTTOMWEAR ──────────────────────────────────────────────────

    {
      name: 'Classic Denim Jeans',
      description: 'Straight-fit denim jeans in authentic washed blue. Five-pocket styling, rigid denim construction for long-lasting wear.',
      price: 1599,
      stock: 50,
      brand: 'FITVERSE',
      gender: 'MENS',
      wearType: 'BOTTOMWEAR',
      category: 'JEANS',
      subCategory: 'DENIM',
      availableSizes: BOT_SIZES,
      images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=800&fit=crop'],
    },
    {
      name: 'Skinny Fit Jeans',
      description: 'Ultra-slim skinny jeans with 2% elastane for stretch comfort. Dark indigo wash, tapered ankle finish.',
      price: 1399,
      stock: 40,
      brand: 'FITVERSE',
      gender: 'MENS',
      wearType: 'BOTTOMWEAR',
      category: 'JEANS',
      subCategory: 'SKINNY',
      availableSizes: BOT_COMMON,
      images: ['https://images.unsplash.com/photo-1475178626620-a4d074967452?w=600&h=800&fit=crop'],
    },
    {
      name: 'Tactical Cargo Pants',
      description: 'Multi-pocket cargo pants in ripstop fabric. Side cargo pockets, adjustable cuffs, relaxed fit.',
      price: 1799,
      stock: 35,
      brand: 'FITVERSE',
      gender: 'MENS',
      wearType: 'BOTTOMWEAR',
      category: 'CARGO',
      subCategory: null,
      availableSizes: ['30', '32', '34', '36', '38', '40'],
      images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=800&fit=crop'],
    },
    {
      name: 'Jogger Trackpant',
      description: 'Athletic trackpant with elastic waist, zip pockets and tapered ankle. Ideal for gym and daily wear.',
      price: 999,
      stock: 55,
      brand: 'FITVERSE',
      gender: 'MENS',
      wearType: 'BOTTOMWEAR',
      category: 'TRACKPANT',
      subCategory: null,
      availableSizes: BOT_COMMON,
      images: ['https://images.unsplash.com/photo-1606902965551-dce093cda6e7?w=600&h=800&fit=crop'],
    },
    {
      name: 'Slim Chino Trouser',
      description: 'Slim-fit chino trouser in stretch twill. Flat front, quarter-top pockets. Versatile for office and outings.',
      price: 1299,
      stock: 30,
      brand: 'FITVERSE',
      gender: 'MENS',
      wearType: 'BOTTOMWEAR',
      category: 'TROUSER',
      subCategory: null,
      availableSizes: BOT_COMMON,
      images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop'],
    },

    // ─── WOMEN — TOPWEAR ───────────────────────────────────────────────────

    {
      name: 'V-Neck Fitted Tee',
      description: 'Soft v-neck t-shirt in a flattering fitted silhouette. Breathable jersey fabric, relaxed enough for all-day comfort.',
      price: 649,
      stock: 65,
      brand: 'FITVERSE',
      gender: 'WOMENS',
      wearType: 'TOPWEAR',
      category: 'TSHIRT',
      subCategory: 'V_NECK',
      availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      images: ['https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=600&h=800&fit=crop'],
    },
    {
      name: 'Cropped Short Sleeve Tee',
      description: 'Trendy cropped length short-sleeve tee. Pair with high-waist jeans or skirts for an effortless look.',
      price: 599,
      stock: 70,
      brand: 'FITVERSE',
      gender: 'WOMENS',
      wearType: 'TOPWEAR',
      category: 'TSHIRT',
      subCategory: 'SHORT_SLEEVED',
      availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
      images: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&h=800&fit=crop'],
    },
    {
      name: 'Textured Weave Shirt',
      description: 'Elegant shirt in a textured weave fabric. Relaxed collar, front tuck-in length, slightly sheer for an airy feel.',
      price: 1199,
      stock: 30,
      brand: 'FITVERSE',
      gender: 'WOMENS',
      wearType: 'TOPWEAR',
      category: 'SHIRT',
      subCategory: 'TEXTURED',
      availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
      images: ['https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=600&h=800&fit=crop'],
    },
    {
      name: 'Oversized Hoodie',
      description: 'Cosy oversized hoodie with a fleece-lined interior. Drop shoulders, side-split hem, kangaroo pocket.',
      price: 1399,
      stock: 40,
      brand: 'FITVERSE',
      gender: 'WOMENS',
      wearType: 'TOPWEAR',
      category: 'HOODIE',
      subCategory: null,
      availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
      images: ['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&h=800&fit=crop'],
    },
    {
      name: 'Quilted Puffer Jacket',
      description: 'Lightweight quilted puffer jacket with a sleek minimal design. Wind and water resistant outer shell.',
      price: 2299,
      stock: 20,
      brand: 'FITVERSE',
      gender: 'WOMENS',
      wearType: 'TOPWEAR',
      category: 'JACKET',
      subCategory: null,
      availableSizes: ['XS', 'S', 'M', 'L'],
      images: ['https://images.unsplash.com/photo-1548630435-998a02010950?w=600&h=800&fit=crop'],
    },

    // ─── WOMEN — BOTTOMWEAR ────────────────────────────────────────────────

    {
      name: 'Baggy Wide-Leg Jeans',
      description: 'Relaxed baggy-fit jeans with a wide leg opening. High-rise waistband for a flattering silhouette. Light blue wash.',
      price: 1499,
      stock: 45,
      brand: 'FITVERSE',
      gender: 'WOMENS',
      wearType: 'BOTTOMWEAR',
      category: 'JEANS',
      subCategory: 'BAGGY',
      availableSizes: ['26', '28', '30', '32', '34'],
      images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=800&fit=crop'],
    },
    {
      name: 'High-Waist Skinny Jeans',
      description: 'Second-skin fit skinny jeans with 4-way stretch denim. High-rise waistband with a button-fly finish.',
      price: 1299,
      stock: 50,
      brand: 'FITVERSE',
      gender: 'WOMENS',
      wearType: 'BOTTOMWEAR',
      category: 'JEANS',
      subCategory: 'SKINNY',
      availableSizes: ['26', '28', '30', '32', '34'],
      images: ['https://images.unsplash.com/photo-1475178626620-a4d074967452?w=600&h=800&fit=crop'],
    },
    {
      name: 'Flared Formal Trouser',
      description: 'Smart flared-hem trouser in a crepe-blend fabric. High-waist, flat-front design. Office and event-ready.',
      price: 1399,
      stock: 35,
      brand: 'FITVERSE',
      gender: 'WOMENS',
      wearType: 'BOTTOMWEAR',
      category: 'TROUSER',
      subCategory: null,
      availableSizes: ['26', '28', '30', '32', '34'],
      images: ['https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=600&h=800&fit=crop'],
    },
    {
      name: 'Slim Fit Trackpant',
      description: 'Slim fit trackpant with elastic waist and ankle zip. Four-way stretch fabric, moisture-wicking finish.',
      price: 899,
      stock: 55,
      brand: 'FITVERSE',
      gender: 'WOMENS',
      wearType: 'BOTTOMWEAR',
      category: 'TRACKPANT',
      subCategory: null,
      availableSizes: ['26', '28', '30', '32', '34', '36'],
      images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&h=800&fit=crop'],
    },
  ];

  for (const productData of products) {
    const { stock, ...rest } = productData;
    // Distribute total stock evenly across available sizes
    const sizeStock = {};
    if (rest.availableSizes && rest.availableSizes.length > 0) {
      const perSize = Math.floor((stock || 0) / rest.availableSizes.length);
      rest.availableSizes.forEach((s) => { sizeStock[s] = perSize; });
    }
    await prisma.product.create({ data: { ...rest, sizeStock } });
  }
  
  console.log(`✅ ${products.length} products created\n`);

  // Create Cart with Items for test user
  console.log('🛒 Creating sample cart...');
  const cart = await prisma.cart.create({
    data: {
      userId: user1.id,
    },
  });

  const sampleProducts = await prisma.product.findMany({
    take: 3,
  });

  for (const product of sampleProducts) {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: 1,
      },
    });
  }
  console.log('✅ Sample cart created\n');

  console.log('🎉 Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Users: 3 (1 admin, 2 regular users)`);
  console.log(`   - Products: ${products.length} (Men + Women, Topwear + Bottomwear)`);
  console.log(`   - Addresses: 2`);
  console.log(`   - Cart Items: 3`);
  console.log('\n🔑 Login Credentials:');
  console.log('   Admin:  admin@fitverse.com / admin123');
  console.log('   User 1: john@example.com / user123');
  console.log('   User 2: jane@example.com / user123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });