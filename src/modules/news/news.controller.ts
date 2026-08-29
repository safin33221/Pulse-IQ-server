import { Controller, Get, Param, Post, Query } from '@nestjs/common';

import { NewsService } from './news.service';
import { NewsQueryDto } from './dto/news-query.dto';

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
  @Get()
  findAll(@Query() query: NewsQueryDto) {
    return this.newsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }
}
