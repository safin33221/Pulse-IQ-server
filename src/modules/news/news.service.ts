import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '@/database/prisma.service';

import { NewsQueryDto } from './dto/news-query.dto';

import { CollectedArticle, RssCollector } from './collectors/rss.collector';
import { KeywordTopicExtractor } from './extractors/keyword-topic.extractor';
import { NewsRankingService } from './services/news-ranking.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

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

  private readonly LATEST_CACHE_PREFIX = 'news:latest';
  private readonly LATEST_CACHE_TTL = 60_000;
  private latestCacheVersion = 1;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rssCollector: RssCollector,
    private readonly newsRankingService: NewsRankingService,
    private readonly topicExtractor: KeywordTopicExtractor,

    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  private isDuplicateSourceUrlError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      return false;
    }

    return typeof error.code === 'string' && error.code === 'P2002';
  }

  private buildNewsWhere(query: NewsQueryDto) {
    const { category, source } = query;

    return {
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
  }

  private async processWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    handler: (item: T) => Promise<R>,
  ): Promise<R[]> {
    if (items.length === 0) {
      return [];
    }

    const workerCount = Math.min(Math.max(1, concurrency), items.length);

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

    const workers = Array.from({ length: workerCount }, () => worker());

    await Promise.all(workers);

    return results;
  }
  private invalidateLatestCache(): void {
    this.latestCacheVersion++;

    this.logger.debug(`Latest news cache invalidated. New version: ${this.latestCacheVersion}`);
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

    const response = {
      feeds: feeds.length,

      fetched: results.reduce((total, result) => total + result.fetched, 0),

      collected: results.reduce((total, result) => total + result.collected, 0),

      duplicates: results.reduce((total, result) => total + result.duplicates, 0),

      failedFeeds: results.filter((result) => result.failed).length,

      feedResults: results,
    };
    if (response.collected > 0) {
      this.invalidateLatestCache();
    }
    return response;
  }

  private async saveArticle(
    article: CollectedArticle,
    sourceId: string,
    categoryId: string,
  ): Promise<boolean> {
    try {
      const topicSlugs = this.topicExtractor.extract(
        article.title,
        article.summary,
        article.content,
      );

      const topics =
        topicSlugs.length > 0
          ? await this.prisma.topic.findMany({
              where: {
                slug: {
                  in: topicSlugs,
                },
              },
              select: {
                id: true,
              },
            })
          : [];

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

          topics: {
            create: topics.map((topic) => ({
              topicId: topic.id,
            })),
          },
        },
      });

      return true;
    } catch (error: unknown) {
      if (this.isDuplicateSourceUrlError(error)) {
        this.logger.debug(`Duplicate article: ${article.sourceUrl}`);

        if (article.imageUrl) {
          await this.prisma.news.updateMany({
            where: {
              sourceUrl: article.sourceUrl,
              imageUrl: null,
            },
            data: {
              imageUrl: article.imageUrl,
            },
          });
        }

        return false;
      }

      throw error;
    }
  }

  async getForYou(query: NewsQueryDto) {
    const { page = 1, limit = 20 } = query;

    const where = this.buildNewsWhere(query);

    const result = await this.newsRankingService.getRankedNews(where, page, limit);

    return {
      data: result.data,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  async getLatest(query: NewsQueryDto) {
    const { page = 1, limit = 20, category, source } = query;

    const cacheKey = [
      'news:latest',
      `v:${this.latestCacheVersion}`,
      `page:${page}`,
      `limit:${limit}`,
      `category:${category ?? 'all'}`,
      `source:${source ?? 'all'}`,
    ].join(':');

    type NewsData = Awaited<ReturnType<typeof this.prisma.news.findMany>>;
    type CacheData = {
      data: NewsData;
      meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };

    try {
      const cached = await this.cache.get<CacheData>(cacheKey);

      if (cached) {
        this.logger.debug(`Latest news cache hit: ${cacheKey}`);
        return cached;
      }

      this.logger.debug(`Latest news cache miss: ${cacheKey}`);
    } catch (error: unknown) {
      this.logger.warn(
        `Redis cache read failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const where = this.buildNewsWhere(query);

    const [news, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,

        orderBy: [
          {
            publishedAt: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],

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

    const result = {
      data: news,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    try {
      await this.cache.set(cacheKey, result, this.LATEST_CACHE_TTL);
    } catch (error: unknown) {
      this.logger.warn(
        `Redis cache write failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return result;
  }

  async findAll(query: NewsQueryDto) {
    const { page = 1, limit = 20 } = query;

    const where = this.buildNewsWhere(query);

    const [news, total] = await Promise.all([
      this.prisma.news.findMany({
        where,

        skip: (page - 1) * limit,
        take: limit,

        orderBy: [
          {
            publishedAt: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],

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

  async findFeed(query: NewsQueryDto, userId?: string) {
    const { category = 'foryou', page = 1, limit = 20 } = query;

    // Personalized feed
    if (category === 'foryou') {
      if (!userId) {
        throw new UnauthorizedException('Authentication required for For You feed');
      }

      return this.newsRankingService.getPersonalizedFeed(userId, page, limit);
    }

    // Category feed
    const where = {
      status: 'PUBLISHED' as const,
      category: {
        slug: category,
      },
    };

    const [news, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,

        orderBy: [
          {
            publishedAt: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],

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

  async remove(id: string) {
    const news = await this.prisma.news.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!news) {
      throw new NotFoundException('News not found');
    }

    await this.prisma.news.delete({
      where: {
        id,
      },
    });

    return {
      message: 'News deleted successfully',
    };
  }
}
