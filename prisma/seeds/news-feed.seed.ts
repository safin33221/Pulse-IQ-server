import { PrismaClient } from '@prisma/client';

export async function seedNewsFeeds(prisma: PrismaClient) {
  const technology = await prisma.category.findUnique({
    where: { slug: 'technology' },
  });

  const business = await prisma.category.findUnique({
    where: { slug: 'business' },
  });

  const techSource = await prisma.newsSource.findUnique({
    where: { slug: 'techcrunch' },
  });

  if (!technology || !business || !techSource) {
    throw new Error('Required category/source not found. Seed categories and sources first.');
  }

  await prisma.newsFeed.createMany({
    data: [
      {
        name: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        sourceId: techSource.id,
        categoryId: technology.id,
      },
    ],
    skipDuplicates: true,
  });
}
