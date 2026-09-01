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
import { Prisma } from '@prisma/client';

interface FeedCollectionResult {
  feedId: string;
  feedName: string;
  fetched: number;
  collected: number;
  duplicates: number;
  failed: boolean;
}

type PersonalizedNews = Prisma.NewsGetPayload<{
  include: {
    category: true;
    source: true;
    topics: { include: { topic: true } };
  };
}>;

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

  private async findForYouNews(userId: string, page: number, limit: number) {
    const [user, interactions] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            include: {
              careerField: true,
              currentRole: true,
              careerGoals: { include: { careerGoal: true } },
            },
          },
          topicInterests: true,
          skillInterests: { include: { skill: true } },
          careerInterests: { include: { careerField: true } },
        },
      }),
      this.prisma.newsInteraction.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
        select: {
          newsId: true,
          type: true,
          news: {
            select: {
              categoryId: true,
              sourceId: true,
              topics: { select: { topicId: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);

    const hiddenNewsIds = interactions
      .filter(({ type }) => type === 'HIDE' || type === 'NOT_INTERESTED')
      .map(({ newsId }) => newsId);

    const positiveInteractions = interactions.filter(({ type }) =>
      ['VIEW', 'CLICK', 'LIKE', 'SAVE', 'SHARE'].includes(type),
    );

    const followedTopicIds = user?.topicInterests.map(({ topicId }) => topicId) ?? [];
    const skillTerms = user?.skillInterests.map(({ skill }) => skill.name) ?? [];
    const careerInterestTerms =
      user?.careerInterests.map(({ careerField }) => careerField.name) ?? [];
    const careerTerms = [
      user?.profile?.careerField?.name,
      user?.profile?.currentRole?.name,
      ...(user?.profile?.careerGoals.map(({ careerGoal }) => careerGoal.name) ?? []),
    ].filter((term): term is string => Boolean(term));

    const behaviorTopicIds = new Set(
      positiveInteractions.flatMap(({ news }) => news.topics.map(({ topicId }) => topicId)),
    );
    const behaviorCategoryIds = new Set(positiveInteractions.map(({ news }) => news.categoryId));
    const behaviorSourceIds = new Set(positiveInteractions.map(({ news }) => news.sourceId));

    const hasPersonalizationSignals =
      careerTerms.length > 0 ||
      careerInterestTerms.length > 0 ||
      skillTerms.length > 0 ||
      followedTopicIds.length > 0 ||
      positiveInteractions.length > 0;

    const candidateLimit = Math.min(Math.max(page * limit * 3, 60), 200);
    const include = {
      category: true,
      source: true,
      topics: { include: { topic: true } },
    } satisfies Prisma.NewsInclude;
    const latestWhere: Prisma.NewsWhereInput = {
      status: 'PUBLISHED',
      ...(hiddenNewsIds.length > 0 && { id: { notIn: hiddenNewsIds } }),
    };

    if (!hasPersonalizationSignals) {
      const [data, total] = await Promise.all([
        this.prisma.news.findMany({
          where: latestWhere,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
          include,
        }),
        this.prisma.news.count({ where: latestWhere }),
      ]);

      return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    const textTerms = [...new Set([...careerTerms, ...careerInterestTerms, ...skillTerms])].slice(
      0,
      20,
    );
    const candidateFilters: Prisma.NewsWhereInput[] = [
      ...(followedTopicIds.length > 0
        ? [{ topics: { some: { topicId: { in: followedTopicIds } } } }]
        : []),
      ...textTerms.map((term) => ({
        OR: [
          { title: { contains: term, mode: 'insensitive' as const } },
          { summary: { contains: term, mode: 'insensitive' as const } },
          { content: { contains: term, mode: 'insensitive' as const } },
        ],
      })),
    ];

    const [matchedNews, latestNews] = await Promise.all([
      candidateFilters.length > 0
        ? this.prisma.news.findMany({
            where: { ...latestWhere, OR: candidateFilters },
            take: candidateLimit,
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            include,
          })
        : Promise.resolve([] as PersonalizedNews[]),
      this.prisma.news.findMany({
        where: latestWhere,
        take: candidateLimit,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        include,
      }),
    ]);

    const candidates = [
      ...new Map([...matchedNews, ...latestNews].map((news) => [news.id, news])).values(),
    ];
    const ranked = candidates
      .map((news) => ({
        news,
        score: this.calculateNewsScore(news, {
          careerTerms,
          careerInterestTerms,
          skillTerms,
          followedTopicIds: new Set(followedTopicIds),
          behaviorTopicIds,
          behaviorCategoryIds,
          behaviorSourceIds,
        }),
      }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          (b.news.publishedAt?.getTime() ?? b.news.createdAt.getTime()) -
            (a.news.publishedAt?.getTime() ?? a.news.createdAt.getTime()),
      );

    const total = ranked.length;
    const start = (page - 1) * limit;
    return {
      data: ranked.slice(start, start + limit).map(({ news }) => news),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private calculateNewsScore(
    news: PersonalizedNews,
    signals: {
      careerTerms: string[];
      careerInterestTerms: string[];
      skillTerms: string[];
      followedTopicIds: Set<string>;
      behaviorTopicIds: Set<string>;
      behaviorCategoryIds: Set<string>;
      behaviorSourceIds: Set<string>;
    },
  ): number {
    const text = [news.title, news.summary, news.content].filter(Boolean).join(' ').toLowerCase();
    const matchesText = (terms: string[]) =>
      terms.some((term) => text.includes(term.toLowerCase()));
    const topicIds = news.topics.map(({ topicId }) => topicId);
    let score = 0;

    if (matchesText(signals.careerTerms)) score += 30;
    if (topicIds.some((topicId) => signals.followedTopicIds.has(topicId))) score += 25;
    if (matchesText(signals.skillTerms)) score += 20;
    if (matchesText(signals.careerInterestTerms)) score += 15;
    if (
      topicIds.some((topicId) => signals.behaviorTopicIds.has(topicId)) ||
      signals.behaviorCategoryIds.has(news.categoryId) ||
      signals.behaviorSourceIds.has(news.sourceId)
    ) {
      score += 10;
    }

    return score;
  }

  async findFeed(query: NewsQueryDto, userId?: string) {
    const { category = 'foryou', page = 1, limit = 20 } = query;
    const isForYouCategory = category === 'foryou' || category === 'for-you';

    // Category-based For You logic belongs to this feed API.
    if (isForYouCategory) {
      if (!userId) {
        throw new UnauthorizedException('Authentication required for For You feed');
      }

      return this.findForYouNews(userId, page, limit);
    }

    // Validate category from database
    const categoryRecord = await this.prisma.category.findUnique({
      where: {
        slug: category,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!categoryRecord) {
      throw new NotFoundException(`Category '${category}' not found`);
    }

    const where = {
      status: 'PUBLISHED' as const,
      categoryId: categoryRecord.id,
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

  async findOneBySlug(slug: string) {
    const news = await this.prisma.news.findUnique({
      where: {
        id: slug,
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
      throw new NotFoundException('News article not found');
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
