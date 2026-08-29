import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';

export interface CollectedArticle {
  title: string;
  sourceUrl: string;
  summary: string | null;
  content: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
}

@Injectable()
export class RssCollector {
  private readonly logger = new Logger(RssCollector.name);

  private readonly parser = new Parser();

  private readonly timeoutMs = 10_000;
  private readonly maxRetries = 2;
  private readonly retryDelayMs = 1_000;

  async collect(feedUrl: string): Promise<CollectedArticle[]> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.fetchAndParse(feedUrl);
      } catch (error: unknown) {
        const attemptNumber = attempt + 1;

        if (attempt >= this.maxRetries) {
          this.logger.error(
            `RSS collection failed after ${attemptNumber} attempts: ${feedUrl}`,
            error instanceof Error ? error.stack : String(error),
          );

          throw error;
        }

        const delay = this.retryDelayMs * 2 ** attempt;

        this.logger.warn(
          `RSS collection failed. Retrying in ${delay}ms ` +
            `(attempt ${attemptNumber}/${this.maxRetries + 1}): ${feedUrl}`,
        );

        await this.delay(delay);
      }
    }

    throw new Error(`RSS collection failed: ${feedUrl}`);
  }

  private async fetchAndParse(feedUrl: string): Promise<CollectedArticle[]> {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await fetch(feedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PulseIQ RSS Collector/1.0',
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
        },
      });

      if (!response.ok) {
        throw new Error(`RSS request failed with status ${response.status}`);
      }

      const xml = await response.text();

      const feed = await this.parser.parseString(xml);

      return feed.items
        .filter((item) => Boolean(item.title && item.link))
        .map((item) => ({
          title: item.title!.trim(),
          sourceUrl: item.link!.trim(),
          summary: item.contentSnippet?.trim() ?? null,
          content: item.content?.trim() ?? null,
          imageUrl: item.enclosure?.url ?? null,
          publishedAt: this.parseDate(item.pubDate),
        }));
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`RSS feed timeout after ${this.timeoutMs}ms`);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async delay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private parseDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }
}
