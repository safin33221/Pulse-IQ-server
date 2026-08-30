import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class NewsRankingService {
  constructor(private readonly prisma: PrismaService) {}

  async getRankedNews(where: object, page: number, limit: number) {
    const news = await this.prisma.news.findMany({
      where,
      include: {
        category: true,
        source: true,
        topics: {
          include: {
            topic: true,
          },
        },
      },
      orderBy: [
        {
          publishedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    const ranked = news
      .map((article) => {
        const freshnessScore = this.calculateFreshnessScore(article.publishedAt);

        const topicScore = this.calculateTopicScore(article.topics.length);

        const categoryScore = this.calculateCategoryScore(article.category.slug);

        const score = freshnessScore * 0.6 + topicScore * 0.25 + categoryScore * 0.15;

        return {
          article,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);

    const total = ranked.length;
    const skip = (page - 1) * limit;

    return {
      data: ranked.slice(skip, skip + limit).map(({ article }) => article),

      total,

      totalPages: Math.ceil(total / limit),
    };
  }

  async getPersonalizedFeed(userId: string, page: number, limit: number) {
    // TODO:
    // Replace this with actual user preference / interaction
    // based ranking when those tables are implemented.

    const news = await this.prisma.news.findMany({
      where: {
        status: 'PUBLISHED',
      },

      include: {
        category: true,
        source: true,
        topics: {
          include: {
            topic: true,
          },
        },
      },

      orderBy: [
        {
          publishedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    const ranked = news
      .map((article) => {
        const freshnessScore = this.calculateFreshnessScore(article.publishedAt);

        const topicScore = this.calculateTopicScore(article.topics.length);

        const categoryScore = this.calculateCategoryScore(article.category.slug);

        // Temporary personalization.
        // userId is intentionally accepted so this method can later
        // use user preferences/interactions.
        const personalizationScore = this.calculatePersonalizationScore(
          userId,
          article.category.slug,
        );

        const score =
          freshnessScore * 0.5 +
          topicScore * 0.2 +
          categoryScore * 0.1 +
          personalizationScore * 0.2;

        return {
          article,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);

    const total = ranked.length;
    const skip = (page - 1) * limit;

    return {
      data: ranked.slice(skip, skip + limit).map(({ article }) => article),

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private calculateFreshnessScore(publishedAt: Date | null): number {
    if (!publishedAt) {
      return 0;
    }

    const ageHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);

    if (ageHours <= 1) return 100;
    if (ageHours <= 6) return 90;
    if (ageHours <= 12) return 80;
    if (ageHours <= 24) return 70;
    if (ageHours <= 48) return 50;
    if (ageHours <= 72) return 30;

    return 10;
  }

  private calculateTopicScore(topicCount: number): number {
    if (topicCount >= 5) return 100;
    if (topicCount >= 3) return 80;
    if (topicCount >= 1) return 60;

    return 20;
  }

  private calculateCategoryScore(categorySlug: string): number {
    return categorySlug ? 50 : 0;
  }

  private calculatePersonalizationScore(_userId: string, _categorySlug: string): number {
    // Temporary baseline.
    // Later this should use:
    // - followed categories
    // - followed topics
    // - reading history
    // - likes/bookmarks
    // - user interests

    return 50;
  }
}
