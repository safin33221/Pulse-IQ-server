import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { NewsService } from '../news.service';

@Injectable()
export class NewsScheduler {
  private readonly logger = new Logger(NewsScheduler.name);

  private isRunning = false;

  constructor(private readonly newsService: NewsService) {}

  @Cron(CronExpression.EVERY_2_HOURS)
  async collectNews(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('News collection already running. Skipping...');
      return;
    }

    this.isRunning = true;

    try {
      this.logger.log('Starting scheduled news collection...');

      const result = await this.newsService.collectFromFeeds();

      this.logger.log(
        `Collection completed: ${result.collected} articles from ${result.feeds} feeds`,
      );
    } catch (error: unknown) {
      this.logger.error(
        'Scheduled news collection failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isRunning = false;
    }
  }
}
