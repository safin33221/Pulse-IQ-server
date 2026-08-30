import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}
  create(createCategoryDto: CreateCategoryDto) {
    return 'This action adds a new category';
  }
  async findAll() {
    return this.prisma.category.findMany({
      where: {
        news: {
          some: {
            status: 'PUBLISHED',
          },
        },
      },

      select: {
        id: true,
        name: true,
        slug: true,
      },

      orderBy: {
        name: 'asc',
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
