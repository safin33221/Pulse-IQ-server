import { Injectable } from '@nestjs/common';

import { TopicExtractor } from './topic-extractor.interface';

interface TopicRule {
  slug: string;
  keywords: string[];
}

@Injectable()
export class KeywordTopicExtractor implements TopicExtractor {
  private readonly topicRules: TopicRule[] = [
    {
      slug: 'artificial-intelligence',
      keywords: [
        'ai',
        'artificial intelligence',
        'machine learning',
        'large language model',
        'llm',
        'openai',
        'anthropic',
        'gemini',
        'chatgpt',
      ],
    },
    {
      slug: 'startups',
      keywords: [
        'startup',
        'startups',
        'founder',
        'funding',
        'venture capital',
        'seed round',
        'series a',
        'series b',
      ],
    },
    {
      slug: 'cybersecurity',
      keywords: [
        'cybersecurity',
        'cyber security',
        'hacker',
        'hackers',
        'malware',
        'ransomware',
        'data breach',
      ],
    },
    {
      slug: 'cloud',
      keywords: ['cloud computing', 'cloud infrastructure', 'aws', 'azure', 'google cloud'],
    },
  ];

  extract(title: string, summary?: string | null, content?: string | null): string[] {
    const text = this.normalizeText(`${title} ${summary ?? ''} ${content ?? ''}`);

    return this.topicRules
      .filter((rule) => rule.keywords.some((keyword) => this.containsKeyword(text, keyword)))
      .map((rule) => rule.slug);
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private containsKeyword(text: string, keyword: string): boolean {
    const normalizedKeyword = this.normalizeText(keyword);

    return new RegExp(`(^|\\s)${this.escapeRegex(normalizedKeyword)}(?=\\s|$)`, 'u').test(text);
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
