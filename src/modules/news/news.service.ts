import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/database/prisma.service';

import { NewsQueryDto } from './dto/news-query.dto';

import { CollectedArticle, RssCollector } from './collectors/rss.collector';

interface FeedCollectionResult {
  feedId: string;
  feedName: string;
  fetched: number;
  collected: number;
  duplicates: number;
  failed: boolean;
}
@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly RSS_CONCURRENCY = 10;
  private readonly RSS_TIMEOUT_MS = 10_000;
  private isDuplicateSourceUrlError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      return false;
    }

    return typeof error.code === 'string' && error.code === 'P2002';
  }
  private async collectFeedWithTimeout(url: string): Promise<CollectedArticle[]> {
    return Promise.race([
      this.rssCollector.collect(url),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`RSS feed timeout after ${this.RSS_TIMEOUT_MS}ms`));
        }, this.RSS_TIMEOUT_MS);
      }),
    ]);
  }
  constructor(
    private readonly prisma: PrismaService,
    private readonly rssCollector: RssCollector,
  ) {}
  private async processWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    handler: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = [];
    let index = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        const currentIndex = index++;

        if (currentIndex >= items.length) {
          return;
        }

        results[currentIndex] = await handler(items[currentIndex]);
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());

    await Promise.all(workers);

    return results;
  }

  async collectFromFeeds() {
    const feeds = await this.prisma.newsFeed.findMany({
      where: {
        isActive: true,
        source: {
          isActive: true,
        },
      },
      select: {
        id: true,
        name: true,
        url: true,
        sourceId: true,
        categoryId: true,
      },
    });

    const results = await this.processWithConcurrency(
      feeds,
      this.RSS_CONCURRENCY,
      async (feed): Promise<FeedCollectionResult> => {
        try {
          const articles = await this.rssCollector.collect(feed.url);

          this.logger.log(`Feed: ${feed.name} → ${articles.length} articles`);

          let collected = 0;
          let duplicates = 0;

          for (const article of articles) {
            const created = await this.saveArticle(article, feed.sourceId, feed.categoryId);

            if (created) {
              collected++;
            } else {
              duplicates++;
            }
          }

          return {
            feedId: feed.id,
            feedName: feed.name,
            fetched: articles.length,
            collected,
            duplicates,
            failed: false,
          };
        } catch (error: unknown) {
          this.logger.error(
            `Feed failed: ${feed.name}`,
            error instanceof Error ? error.stack : String(error),
          );

          return {
            feedId: feed.id,
            feedName: feed.name,
            fetched: 0,
            collected: 0,
            duplicates: 0,
            failed: true,
          };
        }
      },
    );

    return {
      feeds: feeds.length,

      fetched: results.reduce((total, result) => total + result.fetched, 0),

      collected: results.reduce((total, result) => total + result.collected, 0),

      duplicates: results.reduce((total, result) => total + result.duplicates, 0),

      failedFeeds: results.filter((result) => result.failed).length,

      feedResults: results,
    };
  }

  private async saveArticle(
    article: CollectedArticle,
    sourceId: string,
    categoryId: string,
  ): Promise<boolean> {
    try {
      await this.prisma.news.create({
        data: {
          title: article.title,
          summary: article.summary,
          content: article.content,
          sourceUrl: article.sourceUrl,
          imageUrl: article.imageUrl,
          publishedAt: article.publishedAt,
          sourceId,
          categoryId,
          status: 'PUBLISHED',
        },
      });

      this.logger.log(`New article: ${article.title}`);

      return true;
    } catch (error: unknown) {
      if (this.isDuplicateSourceUrlError(error)) {
        this.logger.debug(`Duplicate article: ${article.sourceUrl}`);
        return false;
      }

      throw error;
    }
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
