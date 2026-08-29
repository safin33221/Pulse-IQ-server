export interface TopicExtractor {
  extract(title: string, summary?: string | null, content?: string | null): string[];
}
