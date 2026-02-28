import Parser from 'rss-parser';
import type { FeedItem } from '../types.js';

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'dc:creator'],
  },
});

export async function fetchFeed(url: string): Promise<FeedItem[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch feed: ${response.status}`);
  const xml = await response.text();
  const feed = await parser.parseString(xml);

  return feed.items.map((item) => ({
    title: item.title || '',
    link: item.link || '',
    pubDate: item.pubDate,
    content: item['content:encoded'] || item.content || '',
    contentSnippet: item.contentSnippet || item.content || '',
    description: item.contentSnippet || item.content || item.description || '',
  }));
}
