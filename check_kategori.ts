import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const columns = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Kategori';
  `;
    console.log('Columns in Kategori:', columns);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
