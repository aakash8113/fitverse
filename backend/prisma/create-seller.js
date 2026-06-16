const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // Check if seller already exists
  let seller = await prisma.user.findFirst({ where: { role: 'SELLER' } });

  if (!seller) {
    // Create seller
    const hash = await bcrypt.hash('seller123', 12);
    seller = await prisma.user.create({
      data: {
        name: 'Rahul Verma',
        email: 'seller@fitverse.com',
        phone: '+919999888877',
        password: hash,
        role: 'SELLER',
        isEmailVerified: true,
      },
    });
    console.log(`Seller created: ${seller.email} / seller123`);

    // Create sample products
    await prisma.product.createMany({
      data: [
        {
          name: 'Classic Fit Polo T-Shirt',
          description: 'Premium cotton polo t-shirt with a relaxed fit.',
          price: 1299, brand: 'Urban Threads',
          gender: 'MENS', wearType: 'TOPWEAR', category: 'TSHIRT', subCategory: 'POLO',
          availableSizes: ['S','M','L','XL','XXL'],
          sizeStock: { S: 15, M: 25, L: 30, XL: 20, XXL: 10 },
          images: [], isThrift: false, sellerId: seller.id,
        },
        {
          name: 'Slim Fit Denim Jeans',
          description: 'Modern slim fit denim jeans with stretch comfort.',
          price: 1899, brand: 'Denim Co.',
          gender: 'MENS', wearType: 'BOTTOMWEAR', category: 'JEANS', subCategory: 'SKINNY',
          availableSizes: ['28','30','32','34','36'],
          sizeStock: { '28': 10, '30': 20, '32': 25, '34': 15, '36': 10 },
          images: [], isThrift: false, sellerId: seller.id,
        },
        {
          name: 'Floral Print Summer Dress',
          description: 'Lightweight floral print dress with adjustable straps.',
          price: 2499, brand: 'Bloom Fashion',
          gender: 'WOMENS', wearType: 'TOPWEAR', category: 'TSHIRT', subCategory: 'OVERSIZED',
          availableSizes: ['XS','S','M','L','XL'],
          sizeStock: { XS: 8, S: 15, M: 20, L: 12, XL: 8 },
          images: [], isThrift: false, sellerId: seller.id,
        },
        {
          name: 'Cotton Linen Trouser',
          description: 'Comfortable cotton-linen blend trousers.',
          price: 1599, brand: 'ComfortWear',
          gender: 'WOMENS', wearType: 'BOTTOMWEAR', category: 'TROUSER',
          availableSizes: ['28','30','32','34','36'],
          sizeStock: { '28': 12, '30': 18, '32': 22, '34': 14, '36': 8 },
          images: [], isThrift: false, sellerId: seller.id,
        },
      ],
      skipDuplicates: true,
    });
    console.log('4 sample products created for seller');
  } else {
    console.log(`Seller already exists: ${seller.email} (${seller.id})`);
  }

  // ── Always ensure pickup addresses exist for this seller ───────────
  const existingPickupAddresses = await prisma.pickupAddress.findMany({
    where: { sellerId: seller.id, isActive: true },
  });

  if (existingPickupAddresses.length === 0) {
    // Create default pickup address for seller (needed for Shiprocket)
    await prisma.pickupAddress.create({
      data: {
        sellerId: seller.id,
        name: 'Main Warehouse',
        companyName: 'Rahul Verma Fashion',
        address: '42, Fashion Street, Nr. City Mall',
        address2: 'Opposite Police Station',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390001',
        phone: '+919999888877',
        email: 'seller@fitverse.com',
        isDefault: true,
      },
    });
    console.log('Default pickup address created for seller');

    // Create secondary pickup address
    await prisma.pickupAddress.create({
      data: {
        sellerId: seller.id,
        name: 'Warehouse 2',
        companyName: 'Rahul Verma Fashion',
        address: '15, Industrial Area, GIDC',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390010',
        phone: '+919999888877',
        email: 'seller@fitverse.com',
        isDefault: false,
      },
    });
    console.log('Secondary pickup address created for seller');
  } else {
    console.log(`Seller already has ${existingPickupAddresses.length} pickup address(es) — skipping`);
  }
}

main().catch(e => { console.error('Error:', e.message); }).finally(() => prisma.$disconnect());