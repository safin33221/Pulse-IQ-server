import { Injectable } from '@nestjs/common';
import Parser from 'rss-parser';

export interface CollectedArticle {
  title: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt?: Date;
}

@Injectable()
export class RssCollector {
  private readonly parser = new Parser();

  async collect(feedUrl: string): Promise<CollectedArticle[]> {
    const feed = await this.parser.parseURL(feedUrl);

    return feed.items
      .filter((item) => item.title && item.link)
      .map((item) => ({
        title: item.title!,
        sourceUrl: item.link!,
        imageUrl: item.enclosure?.url,
        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
      }));
  }
}
