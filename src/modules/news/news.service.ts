import { Injectable } from '@nestjs/common';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsQueryDto } from './dto/news-query.dto';

@Injectable()
export class NewsService {
  prisma: any;
  create(createNewsDto: CreateNewsDto) {
    return 'This action adds a new news';
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

  findOne(id: number) {
    return `This action returns a #${id} news`;
  }

  update(id: number, updateNewsDto: UpdateNewsDto) {
    return `This action updates a #${id} news`;
  }

  remove(id: number) {
    return `This action removes a #${id} news`;
  }
}
