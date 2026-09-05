import { PrismaClient } from '@prisma/client';

export async function seedNewsSources(prisma: PrismaClient) {
  const sources = [
    // =========================
    // 🇧🇩 BANGLADESH NEWS
    // =========================
    {
      name: 'Prothom Alo',
      slug: 'prothom-alo',
      baseUrl: 'https://www.prothomalo.com',
    },
    {
      name: 'The Daily Star',
      slug: 'the-daily-star',
      baseUrl: 'https://www.thedailystar.net',
    },

    // =========================
    // 🌍 GENERAL / WORLD NEWS
    // =========================
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

    // =========================
    // 💻 TECHNOLOGY
    // =========================
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
    {
      name: 'Ars Technica',
      slug: 'ars-technica',
      baseUrl: 'https://arstechnica.com',
    },
    {
      name: 'WIRED',
      slug: 'wired',
      baseUrl: 'https://www.wired.com',
    },
    {
      name: 'IEEE Spectrum',
      slug: 'ieee-spectrum',
      baseUrl: 'https://spectrum.ieee.org',
    },

    // =========================
    // 🤖 AI / MACHINE LEARNING
    // =========================
    {
      name: 'MIT Technology Review',
      slug: 'mit-technology-review',
      baseUrl: 'https://www.technologyreview.com',
    },
    {
      name: 'Google AI Blog',
      slug: 'google-ai',
      baseUrl: 'https://blog.google/technology/ai',
    },
    {
      name: 'OpenAI',
      slug: 'openai',
      baseUrl: 'https://openai.com',
    },
    {
      name: 'Anthropic',
      slug: 'anthropic',
      baseUrl: 'https://www.anthropic.com',
    },

    // =========================
    // 🌐 WEB / SOFTWARE / DEVELOPERS
    // =========================
    {
      name: 'MDN Web Docs',
      slug: 'mdn',
      baseUrl: 'https://developer.mozilla.org',
    },
    {
      name: 'Node.js',
      slug: 'nodejs',
      baseUrl: 'https://nodejs.org',
    },
    {
      name: 'React',
      slug: 'react',
      baseUrl: 'https://react.dev',
    },
    {
      name: 'Next.js',
      slug: 'nextjs',
      baseUrl: 'https://nextjs.org',
    },

    // =========================
    // 🔐 SECURITY
    // =========================
    {
      name: 'Krebs on Security',
      slug: 'krebs-on-security',
      baseUrl: 'https://krebsonsecurity.com',
    },
    {
      name: 'The Hacker News',
      slug: 'the-hacker-news',
      baseUrl: 'https://thehackernews.com',
    },
    {
      name: 'NIST',
      slug: 'nist',
      baseUrl: 'https://www.nist.gov',
    },

    // =========================
    // 🚀 STARTUP / BUSINESS
    // =========================
    {
      name: 'VentureBeat',
      slug: 'venturebeat',
      baseUrl: 'https://venturebeat.com',
    },
    {
      name: 'Fast Company',
      slug: 'fast-company',
      baseUrl: 'https://www.fastcompany.com',
    },

    // =========================
    // 💼 TECH JOB / CAREER
    // =========================
    {
      name: 'LinkedIn',
      slug: 'linkedin',
      baseUrl: 'https://www.linkedin.com',
    },
    {
      name: 'Indeed',
      slug: 'indeed',
      baseUrl: 'https://www.indeed.com',
    },

    // =========================
    // 🔬 SCIENCE / SPACE
    // =========================
    {
      name: 'European Space Agency',
      slug: 'esa',
      baseUrl: 'https://www.esa.int',
    },
    {
      name: 'ScienceDaily',
      slug: 'sciencedaily',
      baseUrl: 'https://www.sciencedaily.com',
    },
  ];

  for (const source of sources) {
    await prisma.newsSource.upsert({
      where: {
        slug: source.slug,
      },
      update: {
        name: source.name,
        baseUrl: source.baseUrl,
      },
      create: source,
    });
  }

  console.log(`News sources seeded: ${sources.length}`);
}
