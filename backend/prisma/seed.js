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

  console.log('\n✅ Users created successfully');
  console.log('---------------------------');
  console.log(`Admin: ${admin.email} / admin123`);
  console.log(`User1: ${user1.email} / user123`);
  console.log(`User2: ${user2.email} / user123`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });