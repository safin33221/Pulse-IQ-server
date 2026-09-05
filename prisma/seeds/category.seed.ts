import { PrismaClient } from '@prisma/client';

export async function seedCategories(prisma: PrismaClient) {
  const categories = [
    // ==========================================
    // 💻 TECHNOLOGY
    // ==========================================
    {
      name: 'Technology',
      slug: 'technology',
    },
    {
      name: 'Web Development',
      slug: 'web',
    },
    {
      name: 'Software',
      slug: 'software',
    },
    {
      name: 'Mobile & Apps',
      slug: 'app',
    },
    {
      name: 'Cloud Computing',
      slug: 'cloud',
    },
    {
      name: 'DevOps',
      slug: 'devops',
    },
    {
      name: 'Programming',
      slug: 'programming',
    },

    // ==========================================
    // 🤖 AI
    // ==========================================
    {
      name: 'Artificial Intelligence',
      slug: 'ai',
    },
    {
      name: 'Machine Learning',
      slug: 'machine-learning',
    },

    // ==========================================
    // 🔐 SECURITY
    // ==========================================
    {
      name: 'Cybersecurity',
      slug: 'cybersecurity',
    },

    // ==========================================
    // 🚀 BUSINESS & STARTUPS
    // ==========================================
    {
      name: 'Business',
      slug: 'business',
    },
    {
      name: 'Finance',
      slug: 'finance',
    },
    {
      name: 'Startups',
      slug: 'startups',
    },

    // ==========================================
    // 🇧🇩 BANGLADESH
    // ==========================================
    {
      name: 'Bangladesh',
      slug: 'bangladesh',
    },

    // ==========================================
    // 🌍 WORLD
    // ==========================================
    {
      name: 'World',
      slug: 'world',
    },
    {
      name: 'Politics',
      slug: 'politics',
    },

    // ==========================================
    // 🔬 SCIENCE
    // ==========================================
    {
      name: 'Science',
      slug: 'science',
    },
    {
      name: 'Space',
      slug: 'space',
    },
    {
      name: 'Climate',
      slug: 'climate',
    },

    // ==========================================
    // ❤️ HEALTH
    // ==========================================
    {
      name: 'Health',
      slug: 'health',
    },

    // ==========================================
    // 🎮 ENTERTAINMENT
    // ==========================================
    {
      name: 'Gaming',
      slug: 'gaming',
    },
    {
      name: 'Entertainment',
      slug: 'entertainment',
    },

    // ==========================================
    // ⚽ SPORTS
    // ==========================================
    {
      name: 'Sports',
      slug: 'sports',
    },

    // ==========================================
    // 💼 CAREER
    // ==========================================
    {
      name: 'Tech Jobs',
      slug: 'jobs',
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
