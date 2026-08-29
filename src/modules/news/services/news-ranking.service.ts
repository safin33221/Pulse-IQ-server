import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class NewsRankingService {
  constructor(private readonly prisma: PrismaService) {}

  async getRankedNews(where: Record<string, unknown>, page: number, limit: number) {
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
    });

    const rankedNews = news
      .map((article) => ({
        article,
        score: this.calculateScore(article),
      }))
      .sort((a, b) => b.score - a.score);

    const start = (page - 1) * limit;

    return {
      data: rankedNews.slice(start, start + limit).map(({ article }) => article),
      total: news.length,
      totalPages: Math.ceil(news.length / limit),
    };
  }

  private calculateScore(article: {
    publishedAt: Date | null;
    collectedAt: Date;
    topics: Array<{
      topic: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
  }): number {
    const freshnessScore = this.calculateFreshnessScore(article.publishedAt, article.collectedAt);

    const topicScore = this.calculateTopicScore(article.topics.length);

    return freshnessScore * 0.8 + topicScore * 0.2;
  }

  private calculateFreshnessScore(publishedAt: Date | null, collectedAt: Date): number {
    const referenceDate = publishedAt ?? collectedAt;

    const ageInHours = Math.max(0, Date.now() - referenceDate.getTime()) / (1000 * 60 * 60);

    return Math.max(0, 100 * Math.exp(-ageInHours / 24));
  }

  private calculateTopicScore(topicCount: number): number {
    if (topicCount === 0) {
      return 0;
    }

    return Math.min(topicCount * 20, 100);
  }
}
