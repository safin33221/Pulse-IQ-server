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
    {
      name: 'NIST',
      slug: 'nist',
      baseUrl: 'https://www.nist.gov',
    },
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
