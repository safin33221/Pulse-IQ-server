import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { NewsService } from './news.service';
import { NewsQueryDto } from './dto/news-query.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post('collect')
  collectFromFeeds(): Promise<any> {
    return this.newsService.collectFromFeeds();
  }
  @Get('for-you')
  getForYou(@Query() query: NewsQueryDto) {
    return this.newsService.getForYou(query);
  }
  @Get('latest')
  getLatest(@Query() query: NewsQueryDto) {
    return this.newsService.getLatest(query);
  }
  @Get('feed')
  @UseGuards(JwtAuthGuard)
  async findFeed(@Query() query: NewsQueryDto, @CurrentUser() user: CurrentUserPayload) {
    return this.newsService.findFeed(query, user.userId);
  }
  @Get()
  findAll(@Query() query: NewsQueryDto) {
    return this.newsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }
}
