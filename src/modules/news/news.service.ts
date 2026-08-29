import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/database/prisma.service';

import { NewsQueryDto } from './dto/news-query.dto';

import { CollectedArticle, RssCollector } from './collectors/rss.collector';
import { NewsStatus } from '@prisma/client';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rssCollector: RssCollector,
  ) {}

  async collectFromFeeds() {
    const feeds = await this.prisma.newsFeed.findMany({
      where: {
        isActive: true,
        source: {
          isActive: true,
        },
      },
    });

    let collected = 0;

    for (const feed of feeds) {
      const articles = await this.rssCollector.collect(feed.url);

      for (const article of articles) {
        const created = await this.saveArticle(article, feed.sourceId);

        if (created) {
          collected++;
        }
      }
    }

    return {
      collected,
    };
  }

  private async saveArticle(article: CollectedArticle, sourceId: string): Promise<boolean> {
    const existing = await this.prisma.news.findUnique({
      where: {
        sourceUrl: article.sourceUrl,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return false;
    }

    const category = await this.prisma.category.findFirst({
      where: {
        slug: 'technology',
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      this.logger.warn('Technology category not found');

      return false;
    }

    await this.prisma.news.create({
      data: {
        title: article.title,
        summary: article.summary,
        sourceUrl: article.sourceUrl,
        imageUrl: article.imageUrl,
        publishedAt: article.publishedAt,

        sourceId,
        categoryId: category.id,

        status: NewsStatus.PUBLISHED,
      },
    });

    return true;
  }

  async findAll(query: NewsQueryDto) {
    const { page = 1, limit = 20, category, source } = query;

    const where = {
      status: 'PUBLISHED' as const,

      ...(category && {
        category: {
          slug: category,
        },
      }),

      ...(source && {
        source: {
          slug: source,
        },
      }),
    };

    const [news, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,

        orderBy: {
          publishedAt: 'desc',
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
      }),

      this.prisma.news.count({
        where,
      }),
    ]);

    return {
      data: news,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const news = await this.prisma.news.findUnique({
      where: {
        id,
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
    });

    if (!news) {
      throw new NotFoundException('News not found');
    }

    return news;
  }

  remove(id: string) {
    return `This action removes a #${id} news`;
  }
}
