import { Module } from '@nestjs/common';

import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsScheduler } from './scheduler/news.scheduler';
import { RssCollector } from './collectors/rss.collector';
import { NewsRankingService } from './services/news-ranking.service';
import { KeywordTopicExtractor } from './extractors/keyword-topic.extractor';

@Module({
  controllers: [NewsController],
  providers: [NewsService, NewsRankingService, NewsScheduler, RssCollector, KeywordTopicExtractor],
  exports: [NewsService],
})
export class NewsModule {}
