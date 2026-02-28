import { Hono } from 'hono';
import { z } from 'zod';
import { fetchFeed } from '../services/fetcher.js';
import { filterFeedItems, type FilterOptions } from '../services/filter.js';
import type { FeedItem, SearchField } from '../types.js';

function parseFields(fields: string | undefined): SearchField[] {
  if (!fields) return ['title', 'description', 'content'];
  return fields.split(',') as SearchField[];
}

function itemsToRss(items: FeedItem[], feedUrl: string): string {
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const itemsXml = items
    .map(
      item => `  <item>
    <title><![CDATA[${item.title}]]></title>
    <link>${escapeXml(item.link)}</link>
    <description><![CDATA[${item.description || ''}]]></description>
    ${item.pubDate ? `<pubDate>${escapeXml(item.pubDate)}</pubDate>` : ''}
  </item>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Filtered Feed</title>
    <link>${escapeXml(feedUrl)}</link>
    <description>Filtered RSS Feed</description>
${itemsXml}
  </channel>
</rss>`;
}

export const feedRoute = new Hono().get('/', async (c) => {
  const url = c.req.query('url');
  const include = c.req.query('include');
  const exclude = c.req.query('exclude');
  const match = (c.req.query('match') as 'any' | 'all') || 'any';
  const fields = c.req.query('fields');
  const case_sensitive = c.req.query('case_sensitive') === 'true';
  const format = (c.req.query('format') as 'rss' | 'json') || 'json';

  // Validate URL
  if (!url) {
    return c.json({ error: 'Missing required parameter: url' }, 400);
  }

  try {
    new URL(url);
  } catch {
    return c.json({ error: 'Invalid URL format' }, 400);
  }

  // Fetch and parse the feed
  const items = await fetchFeed(url);

  // Apply filters
  const filterOptions: FilterOptions = {
    include,
    exclude,
    match,
    fields: parseFields(fields),
    case_sensitive,
  };

  const filteredItems = filterFeedItems(items, filterOptions);

  // Return response based on format
  if (format === 'json') {
    return c.json({ items: filteredItems });
  }

  // RSS XML format
  const rss = itemsToRss(filteredItems, url);
  return c.text(rss, 200, {
    'Content-Type': 'application/rss+xml; charset=utf-8',
  });
});
