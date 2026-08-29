import { PrismaClient } from '@prisma/client';

export async function seedCategories(prisma: PrismaClient) {
  const categories = [
    {
      name: 'Technology',
      slug: 'technology',
    },
    {
      name: 'AI',
      slug: 'ai',
    },
    {
      name: 'Business',
      slug: 'business',
    },
    {
      name: 'Finance',
      slug: 'finance',
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
      name: 'Politics',
      slug: 'politics',
    },
    {
      name: 'Health',
      slug: 'health',
    },
    {
      name: 'Sports',
      slug: 'sports',
    },
    {
      name: 'Entertainment',
      slug: 'entertainment',
    },
    {
      name: 'Gaming',
      slug: 'gaming',
    },
    {
      name: 'Cybersecurity',
      slug: 'cybersecurity',
    },
    {
      name: 'Space',
      slug: 'space',
    },
    {
      name: 'Climate',
      slug: 'climate',
    },
    {
      name: 'Startups',
      slug: 'startups',
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
      },
      create: category,
    });
  }

  console.log(`Categories seeded: ${categories.length}`);
}
