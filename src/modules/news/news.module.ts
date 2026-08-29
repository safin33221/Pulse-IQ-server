import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { RssCollector } from './collectors/rss.collector';

@Module({
  controllers: [NewsController],
  providers: [NewsService, RssCollector],
})
export class NewsModule {}
