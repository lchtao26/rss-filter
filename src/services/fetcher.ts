import Parser from 'rss-parser';
import type { FeedItem } from '../types.js';

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'dc:creator'],
  },
});

export async function fetchFeed(url: string): Promise<FeedItem[]> {
  const feed = await parser.parseURL(url);

  return feed.items.map((item) => ({
    title: item.title || '',
    link: item.link || '',
    pubDate: item.pubDate,
    content: item['content:encoded'] || item.content || '',
    contentSnippet: item.contentSnippet || item.content || '',
    description: item.contentSnippet || item.content || item.description || '',
  }));
}
