import { PrismaClient } from '@prisma/client';

export async function seedCategories(prisma: PrismaClient) {
  const categories = [
    {
      name: 'Technology',
      slug: 'technology',
    },
    {
      name: 'Business',
      slug: 'business',
    },
    {
      name: 'Science',
      slug: 'science',
    },
    {
      name: 'World',
      slug: 'world',
    },
    {
      name: 'Sports',
      slug: 'sports',
    },
    {
      name: 'Entertainment',
      slug: 'entertainment',
    },
  ];

  for (const category of categories) {
    // Prisma's generated delegate may be unresolved by the static analyzer.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {},
      create: category,
    });
  }

  console.log('Categories seeded');
}
