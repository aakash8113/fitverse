// Database Seed Script
// Populates database with sample data for testing

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
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
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      password: userPassword,
      role: 'USER',
      isEmailVerified: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1987654321',
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
      name: 'John Doe',
      phone: '+1234567890',
      addressLine1: '123 Fashion Street',
      addressLine2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States',
      isDefault: true,
    },
  });

  const address2 = await prisma.address.create({
    data: {
      userId: user2.id,
      name: 'Jane Smith',
      phone: '+1987654321',
      addressLine1: '456 Style Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'United States',
      isDefault: true,
    },
  });
  console.log('✅ Addresses created\n');

  // Create Products
  console.log('🛍️  Creating products...');
  
  const products = [
    // Men's Products
    {
      name: 'Premium Performance Tank',
      description: 'High-quality moisture-wicking tank top perfect for intense workouts. Features quick-dry fabric and anti-odor technology.',
      price: 59.99,
      stock: 50,
      category: 'MENS',
      images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=800&fit=crop', 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&h=800&fit=crop'],
    },
    {
      name: 'Athletic Joggers',
      description: 'Comfortable joggers with zippered pockets and adjustable waistband. Perfect for gym or casual wear.',
      price: 79.99,
      stock: 35,
      category: 'MENS',
      images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=800&fit=crop'],
    },
    {
      name: 'Sport Compression Shorts',
      description: 'Compression shorts for enhanced performance and muscle support during training.',
      price: 49.99,
      stock: 40,
      category: 'MENS',
      images: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=800&fit=crop'],
    },
    
    // Women's Products
    {
      name: 'High-Waist Leggings',
      description: 'Premium squat-proof leggings with tummy control and moisture management.',
      price: 69.99,
      stock: 60,
      category: 'WOMENS',
      images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&h=800&fit=crop', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=800&fit=crop'],
    },
    {
      name: 'Sports Bra Collection',
      description: 'Supportive sports bra with adjustable straps and removable padding.',
      price: 39.99,
      stock: 45,
      category: 'WOMENS',
      images: ['https://images.unsplash.com/photo-1600881333168-2ef49b341f30?w=600&h=800&fit=crop'],
    },
    {
      name: 'Cropped Workout Top',
      description: 'Trendy cropped top with mesh panels for breathability.',
      price: 44.99,
      stock: 55,
      category: 'WOMENS',
      images: ['https://images.unsplash.com/photo-1581009146145-b5c37e46c243?w=600&h=800&fit=crop'],
    },
    
    // Activewear
    {
      name: 'Running Shorts Pro',
      description: 'Lightweight running shorts with built-in liner and reflective details.',
      price: 54.99,
      stock: 30,
      category: 'ACTIVEWEAR',
      images: ['https://images.unsplash.com/photo-1625977849214-cb74133cb5a7?w=600&h=800&fit=crop'],
    },
    {
      name: 'Training Jacket',
      description: 'Weather-resistant training jacket with breathable mesh lining.',
      price: 99.99,
      stock: 20,
      category: 'ACTIVEWEAR',
      images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop'],
    },
    
    // Footwear
    {
      name: 'Performance Running Shoes',
      description: 'Cushioned running shoes with responsive midsole technology.',
      price: 129.99,
      stock: 25,
      category: 'FOOTWEAR',
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&fit=crop'],
    },
    {
      name: 'Training Sneakers',
      description: 'Versatile training shoes with enhanced stability and grip.',
      price: 109.99,
      stock: 30,
      category: 'FOOTWEAR',
      images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=800&fit=crop'],
    },
    
    // Accessories
    {
      name: 'Yoga Mat Premium',
      description: 'Extra-thick yoga mat with non-slip surface and carrying strap.',
      price: 49.99,
      stock: 40,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=800&fit=crop'],
    },
    {
      name: 'Gym Duffel Bag',
      description: 'Spacious duffel bag with multiple compartments and shoe pocket.',
      price: 69.99,
      stock: 35,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=800&fit=crop'],
    },
    {
      name: 'Resistance Bands Set',
      description: 'Complete set of 5 resistance bands with different tension levels.',
      price: 29.99,
      stock: 50,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&h=800&fit=crop'],
    },
    
    // Thrift
    {
      name: 'Vintage Nike Windbreaker',
      description: 'Authentic vintage Nike windbreaker in excellent condition.',
      price: 45.99,
      stock: 3,
      category: 'THRIFT',
      images: ['https://images.unsplash.com/photo-1504593811423-6dd665756598?w=600&h=800&fit=crop'],
    },
    {
      name: 'Retro Adidas Track Pants',
      description: 'Classic Adidas track pants from the 90s in great condition.',
      price: 39.99,
      stock: 2,
      category: 'THRIFT',
      images: ['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&h=800&fit=crop'],
    },
  ];

  for (const productData of products) {
    await prisma.product.create({ data: productData });
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
        quantity: 2,
      },
    });
  }
  console.log('✅ Sample cart created\n');

  console.log('🎉 Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Users: 3 (1 admin, 2 regular users)`);
  console.log(`   - Products: ${products.length}`);
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
