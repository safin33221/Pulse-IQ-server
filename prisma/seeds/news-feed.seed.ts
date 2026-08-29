import { PrismaClient } from '@prisma/client';

export async function seedNewsFeeds(prisma: PrismaClient) {
  const [technology, business, science, cybersecurity, space] = await Promise.all([
    prisma.category.findUnique({
      where: { slug: 'technology' },
    }),

    prisma.category.findUnique({
      where: { slug: 'business' },
    }),

    prisma.category.findUnique({
      where: { slug: 'science' },
    }),

    prisma.category.findUnique({
      where: { slug: 'cybersecurity' },
    }),

    prisma.category.findUnique({
      where: { slug: 'space' },
    }),
  ]);

  if (!technology || !business || !science || !cybersecurity || !space) {
    throw new Error('Required categories not found. Seed categories first.');
  }

  const [techcrunch, theVerge, arsTechnica, wired, scienceDaily] = await Promise.all([
    prisma.newsSource.findUnique({
      where: { slug: 'techcrunch' },
    }),

    prisma.newsSource.findUnique({
      where: { slug: 'the-verge' },
    }),

    prisma.newsSource.findUnique({
      where: { slug: 'ars-technica' },
    }),

    prisma.newsSource.findUnique({
      where: { slug: 'wired' },
    }),

    prisma.newsSource.findUnique({
      where: { slug: 'sciencedaily' },
    }),
  ]);

  if (!techcrunch || !theVerge || !arsTechnica || !wired || !scienceDaily) {
    throw new Error('Required news sources not found. Seed news sources first.');
  }

  await prisma.newsFeed.createMany({
    data: [
      // --------------------------------------------------
      // TechCrunch
      // --------------------------------------------------
      {
        name: 'TechCrunch - Technology',
        url: 'https://techcrunch.com/feed/',
        sourceId: techcrunch.id,
        categoryId: technology.id,
      },

      // --------------------------------------------------
      // The Verge
      // --------------------------------------------------
      {
        name: 'The Verge - Technology',
        url: 'https://www.theverge.com/rss/index.xml',
        sourceId: theVerge.id,
        categoryId: technology.id,
      },

      // --------------------------------------------------
      // Ars Technica
      // --------------------------------------------------
      {
        name: 'Ars Technica - All News',
        url: 'https://feeds.arstechnica.com/arstechnica/index',
        sourceId: arsTechnica.id,
        categoryId: technology.id,
      },

      // --------------------------------------------------
      // WIRED
      // --------------------------------------------------
      {
        name: 'WIRED - Top Stories',
        url: 'https://www.wired.com/feed/rss',
        sourceId: wired.id,
        categoryId: technology.id,
      },

      {
        name: 'WIRED - AI',
        url: 'https://www.wired.com/feed/tag/ai/latest/rss',
        sourceId: wired.id,
        categoryId: technology.id,
      },

      {
        name: 'WIRED - Science',
        url: 'https://www.wired.com/feed/category/science/latest/rss',
        sourceId: wired.id,
        categoryId: science.id,
      },

      {
        name: 'WIRED - Security',
        url: 'https://www.wired.com/feed/category/security/latest/rss',
        sourceId: wired.id,
        categoryId: cybersecurity.id,
      },

      // --------------------------------------------------
      // ScienceDaily
      // --------------------------------------------------
      {
        name: 'ScienceDaily - All News',
        url: 'https://www.sciencedaily.com/rss/all.xml',
        sourceId: scienceDaily.id,
        categoryId: science.id,
      },

      {
        name: 'ScienceDaily - Technology',
        url: 'https://www.sciencedaily.com/rss/top/technology.xml',
        sourceId: scienceDaily.id,
        categoryId: technology.id,
      },

      {
        name: 'ScienceDaily - Science',
        url: 'https://www.sciencedaily.com/rss/top/science.xml',
        sourceId: scienceDaily.id,
        categoryId: science.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('News feeds seeded');
}
