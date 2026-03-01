import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { parseFeed, generateRssFeed, generateAtomFeed, generateJsonFeed } from 'feedsmith';

// Constants
const FEED_FIELDS = {
  TITLE: 'title',
  DESCRIPTION: 'description',
  CONTENT: 'content',
} as const;

const FEED_FORMATS = {
  RSS: 'rss',
  ATOM: 'atom',
  JSON: 'json',
  RDF: 'rdf',
} as const;

const DEFAULT_FIELDS = 'title,description,content';

const USER_AGENT = 'RSS-Filter/1.0';
const ACCEPT_HEADER = 'application/rss+xml, application/rdf+xml;q=0.8, application/atom+xml;q=0.6, application/xml;q=0.4, text/xml;q=0.4';

// Helper functions
const parseKeywords = (param: string | undefined): string[] =>
  param ? param.split(',').filter(Boolean) : [];

const extractText = (source: any): string => {
  if (typeof source === 'string') return source;
  return source?.text || source?.value || '';
};

const getFieldValue = (item: any, field: string): string => {
  switch (field) {
    case FEED_FIELDS.TITLE:
      return extractText(item.title);
    case FEED_FIELDS.DESCRIPTION:
      return extractText(item.description || item.summary || item.subtitle);
    case FEED_FIELDS.CONTENT:
      return extractText(
        item.content ||
        item.content_encoded ||
        item['content:encoded'] ||
        item.content_html ||
        item.content_text
      );
    default:
      return '';
  }
};

const normalizeKeyword = (kw: string, caseSensitive: boolean): string =>
  caseSensitive ? kw : kw.toLowerCase();

const matchesAny = (text: string, keywords: string[], caseSensitive: boolean): boolean =>
  keywords.some(kw => text.includes(normalizeKeyword(kw, caseSensitive)));

const matchesAll = (text: string, keywords: string[], caseSensitive: boolean): boolean =>
  keywords.every(kw => text.includes(normalizeKeyword(kw, caseSensitive)));

const querySchema = z.object({
  url: z.string().url(),
  include_all: z.string().optional(),
  include_any: z.string().optional(),
  exclude_all: z.string().optional(),
  exclude_any: z.string().optional(),
  fields: z.string().optional().default(DEFAULT_FIELDS),
  case_sensitive: z.enum(['true', 'false']).optional().default('false').transform(v => v === 'true'),
});

export const feedRoute = new Hono().get(
  '/',
  zValidator('query', querySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Invalid query parameters' }, 400);
    }
  }),
  async (c) => {
    const query = c.req.valid('query');

    try {
      const response = await fetch(query.url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': ACCEPT_HEADER,
        },
      });

      if (!response.ok) {
        return c.text(`Failed to fetch URL: ${response.status} ${response.statusText}`, response.status as 400 | 401 | 403 | 404 | 500 | 502 | 503 | 504);
      }

      const text = await response.text();
      const parsed = parseFeed(text);
      const originalFormat = parsed.format;
      let feedData: any = parsed.feed;

      // Extract items based on feed type
      const itemsKey = originalFormat === FEED_FORMATS.ATOM ? 'entries' : 'items';
      const items: any[] = feedData[itemsKey] || [];

      const includeAllKeywords = parseKeywords(query.include_all);
      const includeAnyKeywords = parseKeywords(query.include_any);
      const excludeAllKeywords = parseKeywords(query.exclude_all);
      const excludeAnyKeywords = parseKeywords(query.exclude_any);
      const fields = query.fields.split(',').filter(Boolean);

      // Pre-compute normalized keywords once (before filtering loop)
      const normalizeAll = (kws: string[]) => kws.map(kw => normalizeKeyword(kw, query.case_sensitive));
      const normalizedIncludeAll = normalizeAll(includeAllKeywords);
      const normalizedIncludeAny = normalizeAll(includeAnyKeywords);
      const normalizedExcludeAll = normalizeAll(excludeAllKeywords);
      const normalizedExcludeAny = normalizeAll(excludeAnyKeywords);

      const filterItems = (item: any) => {
        // Build searchable text from specified fields
        let searchableText = fields
          .map(field => getFieldValue(item, field))
          .join(' ');

        if (!query.case_sensitive) {
          searchableText = searchableText.toLowerCase();
        }

        // Exclude ANY check
        if (normalizedExcludeAny.length > 0 && matchesAny(searchableText, normalizedExcludeAny, true)) {
          return false;
        }

        // Exclude ALL check
        if (normalizedExcludeAll.length > 0 && matchesAll(searchableText, normalizedExcludeAll, true)) {
          return false;
        }

        // Include ALL check
        if (normalizedIncludeAll.length > 0 && !matchesAll(searchableText, normalizedIncludeAll, true)) {
          return false;
        }

        // Include ANY check
        if (normalizedIncludeAny.length > 0 && !matchesAny(searchableText, normalizedIncludeAny, true)) {
          return false;
        }

        return true;
      };

      const filteredItems = items.filter(filterItems);

      // Set filtered items back to appropriate key
      feedData[itemsKey] = filteredItems;

      try {
        if (originalFormat === FEED_FORMATS.ATOM) {
          return c.text(generateAtomFeed(feedData), 200, { 'Content-Type': 'application/atom+xml' });
        }
        if (originalFormat === FEED_FORMATS.JSON) {
          return c.text(generateJsonFeed(feedData) as string, 200, { 'Content-Type': 'application/feed+json' });
        }
        return c.text(generateRssFeed(feedData), 200, { 'Content-Type': 'application/rss+xml' });
      } catch (e) {
        return c.text('Error generating feed: ' + (e as Error).message, 500);
      }
    } catch (e) {
      if ((e as Error).message?.includes('Unrecognized feed format')) {
        return c.text('Unrecognized feed format from target URL', 500);
      }
      return c.text('Failed to process feed: ' + (e as Error).message, 500);
    }
  }
);
