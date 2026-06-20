import prisma from '../data/connection.js'; // This already initializes your client with the pg adapter!
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean up any existing tokens/users to avoid unique constraint errors during testing
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Define a default secure password and hash it
  const plainTextPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin123!'; 
  const hashedPassword = await bcrypt.hash(plainTextPassword, 10);

  // 3. Create your first user
  const firstUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
    },
  });

  console.log('✅ Seeding complete!');
  console.log('-----------------------------------------------');
  console.log(`Created User Email: ${firstUser.email}`);
  console.log(`Default Password:   ${plainTextPassword}`); // Fixed variable name here
  console.log('-----------------------------------------------');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });