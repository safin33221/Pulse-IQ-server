import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { NewsService } from '../news.service';

@Injectable()
export class NewsScheduler {
  private readonly logger = new Logger(NewsScheduler.name);

  constructor(private readonly newsService: NewsService) {}

  @Cron('*/30 * * * *')
  async collectNews(): Promise<void> {
    this.logger.log('Starting scheduled news collection...');

    try {
      const result = await this.newsService.collectFromFeeds();

      this.logger.log(`News collection completed: ${result.collected} new articles`);
    } catch (error: unknown) {
      this.logger.error(
        'News collection failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
