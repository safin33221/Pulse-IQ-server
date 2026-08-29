import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';

export interface CollectedArticle {
  title: string;
  sourceUrl: string;
  summary?: string;
  imageUrl?: string;
  publishedAt?: Date;
}

@Injectable()
export class RssCollector {
  private readonly logger = new Logger(RssCollector.name);

  private readonly parser = new Parser();

  async collect(feedUrl: string): Promise<CollectedArticle[]> {
    try {
      const feed = await this.parser.parseURL(feedUrl);

      return feed.items
        .filter((item) => Boolean(item.title) && Boolean(item.link))
        .map((item) => ({
          title: item.title!,
          sourceUrl: item.link!,
          summary: item.contentSnippet,
          imageUrl: item.enclosure?.url,
          publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        }));
    } catch (error: unknown) {
      this.logger.error(
        `Failed to collect feed: ${feedUrl}`,
        error instanceof Error ? error.stack : String(error),
      );

      return [];
    }
  }
}
