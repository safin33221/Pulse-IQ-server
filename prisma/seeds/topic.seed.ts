import { PrismaClient } from '@prisma/client';

export async function seedTopics(prisma: PrismaClient): Promise<void> {
  const topics = [
    {
      name: 'Artificial Intelligence',
      slug: 'artificial-intelligence',
    },
    {
      name: 'Startups',
      slug: 'startups',
    },
    {
      name: 'Cybersecurity',
      slug: 'cybersecurity',
    },
    {
      name: 'Cloud',
      slug: 'cloud',
    },
  ];

  await prisma.topic.createMany({
    data: topics,
    skipDuplicates: true,
  });

  console.log(`Seeded ${topics.length} topics`);
}
