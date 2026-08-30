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

type RssMedia = {
  $?: {
    url?: string;
  };
  url?: string;
};

type RssItem = {
  mediaContent?: RssMedia[];
  mediaThumbnail?: RssMedia[];
};

@Injectable()
export class RssCollector {
  private readonly logger = new Logger(RssCollector.name);

  private readonly parser = new Parser<object, RssItem>({
    customFields: {
      item: [
        ['media:content', 'mediaContent', { keepArray: true }],
        ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ],
    },
  });

  private readonly timeoutMs = 10_000;
  private readonly maxRetries = 2;
  private readonly retryDelayMs = 1_000;
  private readonly maxItemsPerFeed = 100;

  async collect(feedUrl: string): Promise<CollectedArticle[]> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.fetchAndParse(feedUrl);
      } catch (error: unknown) {
        const attemptNumber = attempt + 1;

        if (attempt >= this.maxRetries || !this.isRetryableError(error)) {
          this.logger.error(
            `RSS collection failed after ${attemptNumber} attempt(s): ${feedUrl}`,
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
        throw new RssHttpError(
          `RSS request failed with status ${response.status}`,
          response.status,
        );
      }

      const xml = await response.text();

      const feed = await this.parser.parseString(xml);

      return feed.items
        .slice(0, this.maxItemsPerFeed)
        .filter(
          (item) =>
            typeof item.title === 'string' &&
            item.title.trim().length > 0 &&
            typeof item.link === 'string' &&
            item.link.trim().length > 0,
        )
        .map((item) => ({
          title: item.title!.trim(),

          sourceUrl: item.link!.trim(),

          summary:
            typeof item.contentSnippet === 'string' ? item.contentSnippet.trim() || null : null,

          content: typeof item.content === 'string' ? item.content.trim() || null : null,

          imageUrl: this.extractImageUrl(item, item.link!),

          publishedAt: this.parseDate(item.pubDate ?? item.isoDate),
        }));
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new RssTimeoutError(`RSS feed timeout after ${this.timeoutMs}ms`);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof RssTimeoutError) {
      return true;
    }

    if (error instanceof RssHttpError) {
      return [408, 429, 500, 502, 503, 504].includes(error.status);
    }

    // Network / parser / unknown errors can be transient.
    return true;
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

  private extractImageUrl(item: RssItem & Parser.Item, articleUrl: string): string | null {
    const candidates = [
      item.enclosure?.url,
      ...this.getMediaUrls(item.mediaContent),
      ...this.getMediaUrls(item.mediaThumbnail),
      this.getImageUrlFromHtml(item.content),
      this.getImageUrlFromHtml(item.contentSnippet),
    ];

    for (const candidate of candidates) {
      const normalizedUrl = this.normalizeImageUrl(candidate, articleUrl);

      if (normalizedUrl) {
        return normalizedUrl;
      }
    }

    return null;
  }

  private getMediaUrls(media?: RssMedia[]): Array<string | undefined> {
    return media?.map((entry) => entry.$?.url ?? entry.url) ?? [];
  }

  private getImageUrlFromHtml(html?: string): string | undefined {
    if (!html) {
      return undefined;
    }

    return html.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
  }

  private normalizeImageUrl(value: string | undefined, baseUrl: string): string | null {
    if (!value) {
      return null;
    }

    try {
      const url = new URL(value.trim(), baseUrl);

      return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
    } catch {
      return null;
    }
  }
}

class RssTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RssTimeoutError';
  }
}

class RssHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'RssHttpError';
  }
}
