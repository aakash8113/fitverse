// Script to add a business account + API key to an existing database
// Run: node prisma/add-business.js

require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();
const hashApiKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

async function main() {
  // Check if business already exists
  const existing = await prisma.user.findFirst({ where: { role: 'BUSINESS' } });
  if (existing) {
    console.log(`Business already exists: ${existing.email}`);
    return;
  }

  const businessPassword = await bcrypt.hash('business123', 12);
  const businessKeyRaw = 'fv_test_business_api_key_12345678';
  const businessKeyHash = hashApiKey(businessKeyRaw);

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
      keyPrefix: 'fv_test_bus...',
      isActive: true,
    },
  });

  console.log('✅ Business account created:');
  console.log(`   Email:     business@fitverse.com`);
  console.log(`   Password:  business123`);
  console.log(`   Credits:   500`);
  console.log(`   API Key:   ${businessKeyRaw}`);
}

main()
  .catch((e) => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());