import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Hash password
  const password = 'kopikita123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin user if they don't exist
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@example.com' },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        username: 'admin',
        name: 'Admin Sistem',
        password: hashedPassword,
        role: 'ADMIN',
        statusUser: 'ACTIVE',
      },
    });

    console.log('✅ Admin user created!');
  } else {
    console.log('ℹ️ Admin already exists, skipped seeding.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });