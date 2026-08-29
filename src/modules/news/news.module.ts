import { Module } from '@nestjs/common';

import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsScheduler } from './scheduler/news.scheduler';
import { RssCollector } from './collectors/rss.collector';

@Module({
  controllers: [NewsController],
  providers: [NewsService, NewsScheduler, RssCollector],
  exports: [NewsService],
})
export class NewsModule {}
