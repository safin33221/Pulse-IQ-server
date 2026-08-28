import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { seedCategories, seedNewsSources } from './seeds';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await seedCategories(prisma);
  await seedNewsSources(prisma);

  console.log('Database seeding completed');
}

main()
  .catch((error) => {
    console.error('Database seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
