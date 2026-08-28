import { PrismaClient } from '@prisma/client';

export async function seedNewsSources(prisma: PrismaClient) {
  const sources = [
    {
      name: 'Reuters',
      slug: 'reuters',
      baseUrl: 'https://www.reuters.com',
    },
    {
      name: 'BBC',
      slug: 'bbc',
      baseUrl: 'https://www.bbc.com',
    },
    {
      name: 'TechCrunch',
      slug: 'techcrunch',
      baseUrl: 'https://techcrunch.com',
    },
    {
      name: 'The Verge',
      slug: 'the-verge',
      baseUrl: 'https://www.theverge.com',
    },
  ];

  for (const source of sources) {
    // Prisma's generated delegate type may be unavailable to the linter in seed files.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await prisma.newsSource.upsert({
      where: {
        slug: source.slug,
      },
      update: {},
      create: source,
    });
  }

  console.log('News sources seeded');
}
