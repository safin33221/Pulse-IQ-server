import { PrismaClient } from '@prisma/client';

export async function seedNewsFeeds(prisma: PrismaClient) {
  const sources = await prisma.newsSource.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  const sourceMap = new Map(sources.map((source) => [source.slug, source.id]));

  const feeds = [
    {
      sourceSlug: 'techcrunch',
      name: 'TechCrunch',
      url: 'https://techcrunch.com/feed/',
    },
    {
      sourceSlug: 'bbc',
      name: 'BBC News',
      url: 'https://feeds.bbci.co.uk/news/rss.xml',
    },
  ];

  for (const feed of feeds) {
    const sourceId = sourceMap.get(feed.sourceSlug);

    if (!sourceId) {
      console.warn(`Source not found: ${feed.sourceSlug}`);
      continue;
    }

    await prisma.newsFeed.upsert({
      where: {
        url: feed.url,
      },
      update: {
        name: feed.name,
        sourceId,
        isActive: true,
      },
      create: {
        name: feed.name,
        url: feed.url,
        sourceId,
      },
    });
  }

  console.log('News feeds seeded');
}
