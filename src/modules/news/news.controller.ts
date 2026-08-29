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

  @Get()
  findAll(@Query() query: NewsQueryDto) {
    return this.newsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }
}
