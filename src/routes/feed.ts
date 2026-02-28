import { Hono } from 'hono';
import { parseFeed } from 'feedsmith';
import { fetchFeed } from '../services/fetcher.js';
import { filterFeedItems, type FilterOptions } from '../services/filter.js';
import type { SearchField } from '../types.js';

function parseFields(fields: string | undefined): SearchField[] {
  if (!fields) return ['title', 'description', 'content'];
  return fields.split(',') as SearchField[];
}

// RSS generator that preserves feed metadata from feedsmith
function generateRss(feed: {
  title?: string;
  link?: string;
  description?: string;
  language?: string;
  copyright?: string;
  image?: { url?: string; title?: string; link?: string };
  items?: Array<{
    title?: string;
    link?: string;
    description?: string;
    content?: { encoded?: string } | string;
    pubDate?: string;
  }>;
}): string {
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const channelElements = [];

  if (feed.title) {
    channelElements.push(`    <title><![CDATA[${feed.title}]]></title>`);
  }
  if (feed.link) {
    channelElements.push(`    <link>${escapeXml(feed.link)}</link>`);
  }
  if (feed.description) {
    channelElements.push(`    <description><![CDATA[${feed.description}]]></description>`);
  }
  if (feed.language) {
    channelElements.push(`    <language>${escapeXml(feed.language)}</language>`);
  }
  if (feed.copyright) {
    channelElements.push(`    <copyright>${escapeXml(feed.copyright)}</copyright>`);
  }
  if (feed.image?.url) {
    channelElements.push(`    <image>
      <url>${escapeXml(feed.image.url)}</url>
      <title>${escapeXml(feed.image.title || feed.title || '')}</title>
      <link>${escapeXml(feed.image.link || feed.link || '')}</link>
    </image>`);
  }

  const itemsXml = (feed.items ?? [])
    .map(item => {
      const itemElements = [];
      if (item.title) {
        itemElements.push(`    <title><![CDATA[${item.title}]]></title>`);
      }
      if (item.link) {
        itemElements.push(`    <link>${escapeXml(item.link)}</link>`);
      }
      if (item.description) {
        itemElements.push(`    <description><![CDATA[${item.description}]]></description>`);
      }
      // Handle content:encoded
      let content = item.content;
      if (typeof content === 'object' && content?.encoded) {
        itemElements.push(`    <content:encoded><![CDATA[${content.encoded}]]></content:encoded>`);
      } else if (typeof content === 'string') {
        itemElements.push(`    <content:encoded><![CDATA[${content}]]></content:encoded>`);
      }
      if (item.pubDate) {
        itemElements.push(`    <pubDate>${escapeXml(item.pubDate)}</pubDate>`);
      }
      return `  <item>\n${itemElements.join('\n')}\n  </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
${channelElements.join('\n')}
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
  const { feed } = await fetchFeed(url);

  // Apply filters
  const filterOptions: FilterOptions = {
    include,
    exclude,
    match,
    fields: parseFields(fields),
    case_sensitive,
  };

  const filteredItems = filterFeedItems(feed.items ?? [], filterOptions);

  // Return response based on format
  if (format === 'json') {
    return c.json({ feed: { ...feed, items: filteredItems } });
  }

  // RSS XML format - use custom generator to preserve original feed metadata
  const rss = generateRss({ ...feed, items: filteredItems });
  return c.text(rss, 200, {
    'Content-Type': 'application/rss+xml; charset=utf-8',
  });
});
