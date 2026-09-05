import { PrismaClient } from '@prisma/client';

export async function seedNewsFeeds(prisma: PrismaClient) {
  // ==================================================
  // CATEGORIES
  // ==================================================

  const [
    technology,
    business,
    science,
    cybersecurity,
    space,
    ai,
    web,
    software,
    app,
    cloud,
    devops,
    jobs,
  ] = await Promise.all([
    prisma.category.findUnique({ where: { slug: 'technology' } }),
    prisma.category.findUnique({ where: { slug: 'business' } }),
    prisma.category.findUnique({ where: { slug: 'science' } }),
    prisma.category.findUnique({ where: { slug: 'cybersecurity' } }),
    prisma.category.findUnique({ where: { slug: 'space' } }),
    prisma.category.findUnique({ where: { slug: 'ai' } }),
    prisma.category.findUnique({ where: { slug: 'web' } }),
    prisma.category.findUnique({ where: { slug: 'software' } }),
    prisma.category.findUnique({ where: { slug: 'app' } }),
    prisma.category.findUnique({ where: { slug: 'cloud' } }),
    prisma.category.findUnique({ where: { slug: 'devops' } }),
    prisma.category.findUnique({ where: { slug: 'jobs' } }),
  ]);

  if (
    !technology ||
    !business ||
    !science ||
    !cybersecurity ||
    !space ||
    !ai ||
    !web ||
    !software ||
    !app ||
    !cloud ||
    !devops ||
    !jobs
  ) {
    throw new Error('Required categories not found. Seed categories first.');
  }

  // ==================================================
  // NEWS SOURCES
  // ==================================================

  const [
    prothomAlo,
    dailyStar,
    reuters,
    bbc,
    techcrunch,
    theVerge,
    arsTechnica,
    wired,
    scienceDaily,
    mitTechnologyReview,
    googleAI,
    openai,
    anthropic,
    hackerNews,
    krebs,
    ventureBeat,
  ] = await Promise.all([
    prisma.newsSource.findUnique({
      where: { slug: 'prothom-alo' },
    }),

    prisma.newsSource.findUnique({
      where: { slug: 'the-daily-star' },
    }),

    prisma.newsSource.findUnique({
      where: { slug: 'reuters' },
    }),

    prisma.newsSource.findUnique({
      where: { slug: 'bbc' },
    }),

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

    prisma.newsSource.findUnique({
      where: { slug: 'mit-technology-review' },
    }),

    prisma.newsSource.findUnique({
      where: { slug: 'google-ai' },
    }),

    prisma.newsSource.findUnique({
      where: { slug: 'openai' },
    }),

    prisma.newsSource.findUnique({
      where: { slug: 'anthropic' },
    }),

    prisma.newsSource.findUnique({
      where: { slug: 'the-hacker-news' },
    }),

    prisma.newsSource.findUnique({
      where: { slug: 'krebs-on-security' },
    }),

    prisma.newsSource.findUnique({
      where: { slug: 'venturebeat' },
    }),
  ]);

  if (
    !prothomAlo ||
    !dailyStar ||
    !reuters ||
    !bbc ||
    !techcrunch ||
    !theVerge ||
    !arsTechnica ||
    !wired ||
    !scienceDaily ||
    !mitTechnologyReview ||
    !googleAI ||
    !openai ||
    !anthropic ||
    !hackerNews ||
    !krebs ||
    !ventureBeat
  ) {
    throw new Error('Required news sources not found. Seed news sources first.');
  }

  // ==================================================
  // RSS FEEDS
  // ==================================================

  await prisma.newsFeed.createMany({
    data: [
      // ==================================================
      // 🇧🇩 BANGLADESH
      // ==================================================

      {
        name: 'Prothom Alo - Technology',
        url: 'https://en.prothomalo.com/topic/technology',
        sourceId: prothomAlo.id,
        categoryId: technology.id,
      },

      {
        name: 'The Daily Star - Tech & Startup',
        url: 'https://www.thedailystar.net/tech-startup',
        sourceId: dailyStar.id,
        categoryId: technology.id,
      },

      // ==================================================
      // 🌍 GENERAL / WORLD
      // ==================================================

      {
        name: 'Reuters - Technology',
        url: 'https://www.reuters.com/technology/',
        sourceId: reuters.id,
        categoryId: technology.id,
      },

      {
        name: 'BBC - Technology',
        url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
        sourceId: bbc.id,
        categoryId: technology.id,
      },

      // ==================================================
      // 💻 TECHCRUNCH
      // ==================================================

      {
        name: 'TechCrunch - Technology',
        url: 'https://techcrunch.com/feed/',
        sourceId: techcrunch.id,
        categoryId: technology.id,
      },

      {
        name: 'TechCrunch - Startups',
        url: 'https://techcrunch.com/category/startups/feed/',
        sourceId: techcrunch.id,
        categoryId: business.id,
      },

      // ==================================================
      // 🌐 THE VERGE
      // ==================================================

      {
        name: 'The Verge - Technology',
        url: 'https://www.theverge.com/rss/index.xml',
        sourceId: theVerge.id,
        categoryId: technology.id,
      },

      // ==================================================
      // 🧠 ARS TECHNICA
      // ==================================================

      {
        name: 'Ars Technica - Technology',
        url: 'https://feeds.arstechnica.com/arstechnica/index',
        sourceId: arsTechnica.id,
        categoryId: technology.id,
      },

      // ==================================================
      // 📰 WIRED
      // ==================================================

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
        categoryId: ai.id,
      },

      {
        name: 'WIRED - Security',
        url: 'https://www.wired.com/feed/category/security/latest/rss',
        sourceId: wired.id,
        categoryId: cybersecurity.id,
      },

      {
        name: 'WIRED - Science',
        url: 'https://www.wired.com/feed/category/science/latest/rss',
        sourceId: wired.id,
        categoryId: science.id,
      },

      // ==================================================
      // 🔬 SCIENCE DAILY
      // ==================================================

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

      {
        name: 'ScienceDaily - Space',
        url: 'https://www.sciencedaily.com/rss/space_time/space.xml',
        sourceId: scienceDaily.id,
        categoryId: space.id,
      },

      // ==================================================
      // 🤖 MIT TECHNOLOGY REVIEW
      // ==================================================

      {
        name: 'MIT Technology Review - AI',
        url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
        sourceId: mitTechnologyReview.id,
        categoryId: ai.id,
      },

      // ==================================================
      // 🤖 GOOGLE AI
      // ==================================================

      {
        name: 'Google AI',
        url: 'https://blog.google/technology/ai/rss/',
        sourceId: googleAI.id,
        categoryId: ai.id,
      },

      // ==================================================
      // 🤖 OPENAI
      // ==================================================

      {
        name: 'OpenAI - News',
        url: 'https://openai.com/news/rss.xml',
        sourceId: openai.id,
        categoryId: ai.id,
      },

      // ==================================================
      // 🤖 ANTHROPIC
      // ==================================================

      {
        name: 'Anthropic - News',
        url: 'https://www.anthropic.com/news/rss.xml',
        sourceId: anthropic.id,
        categoryId: ai.id,
      },

      // ==================================================
      // 🔐 THE HACKER NEWS
      // ==================================================

      {
        name: 'The Hacker News - Cybersecurity',
        url: 'https://feeds.feedburner.com/TheHackersNews',
        sourceId: hackerNews.id,
        categoryId: cybersecurity.id,
      },

      // ==================================================
      // 🔐 KREBS ON SECURITY
      // ==================================================

      {
        name: 'Krebs on Security',
        url: 'https://krebsonsecurity.com/feed/',
        sourceId: krebs.id,
        categoryId: cybersecurity.id,
      },

      // ==================================================
      // 🚀 VENTUREBEAT
      // ==================================================

      {
        name: 'VentureBeat - AI',
        url: 'https://venturebeat.com/category/ai/feed/',
        sourceId: ventureBeat.id,
        categoryId: ai.id,
      },

      {
        name: 'VentureBeat - Technology',
        url: 'https://venturebeat.com/feed/',
        sourceId: ventureBeat.id,
        categoryId: technology.id,
      },
    ],

    skipDuplicates: true,
  });

  console.log('News feeds seeded successfully');
}
