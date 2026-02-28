import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { parseFeed, generateRssFeed, generateAtomFeed, generateJsonFeed } from 'feedsmith';

const querySchema = z.object({
  url: z.string().url(),
  include: z.string().optional(),
  exclude: z.string().optional(),
  match: z.enum(['any', 'all']).optional().default('any'),
  fields: z.string().optional().default('title,description,content'),
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
          'User-Agent': 'RSS-Filter/1.0',
          'Accept': 'application/rss+xml, application/rdf+xml;q=0.8, application/atom+xml;q=0.6, application/xml;q=0.4, text/xml;q=0.4'
        },
      });

      if (!response.ok) {
        return c.text(`Failed to fetch URL: ${response.status} ${response.statusText}`, response.status as any);
      }

      const text = await response.text();
      const parsed = parseFeed(text);
      const originalFormat = parsed.format;
      let feedData: any = parsed.feed;

      // Extract items based on feed type
      let items: any[] = [];
      if (originalFormat === 'rss' && feedData.items) items = feedData.items;
      else if (originalFormat === 'atom' && feedData.entries) items = feedData.entries;
      else if (originalFormat === 'json' && feedData.items) items = feedData.items;
      else if (originalFormat === 'rdf' && feedData.items) items = feedData.items;

      const includeKeywords = query.include ? query.include.split(',').filter(Boolean) : [];
      const excludeKeywords = query.exclude ? query.exclude.split(',').filter(Boolean) : [];
      const fields = query.fields.split(',').filter(Boolean);

      const filterItems = (item: any) => {
        let searchableText = '';

        if (fields.includes('title')) {
          const source = item.title;
          if (source) searchableText += ' ' + (typeof source === 'string' ? source : source.text || source.value || '');
        }

        if (fields.includes('description')) {
          const source = item.description || item.summary || item.subtitle;
          if (source) searchableText += ' ' + (typeof source === 'string' ? source : source.text || source.value || '');
        }

        if (fields.includes('content')) {
          const source = item.content || item.content_encoded || item['content:encoded'] || item.content_html || item.content_text;
          if (source) searchableText += ' ' + (typeof source === 'string' ? source : source.text || source.value || '');
        }

        let targetText = query.case_sensitive ? searchableText : searchableText.toLowerCase();

        // Exclude check
        if (excludeKeywords.length > 0) {
          const hasExclude = excludeKeywords.some(kw => {
            const tk = query.case_sensitive ? kw : kw.toLowerCase();
            return targetText.includes(tk);
          });
          if (hasExclude) return false;
        }

        // Include check
        if (includeKeywords.length > 0) {
          if (query.match === 'all') {
            const hasAll = includeKeywords.every(kw => {
              const tk = query.case_sensitive ? kw : kw.toLowerCase();
              return targetText.includes(tk);
            });
            if (!hasAll) return false;
          } else {
            const hasAny = includeKeywords.some(kw => {
              const tk = query.case_sensitive ? kw : kw.toLowerCase();
              return targetText.includes(tk);
            });
            if (!hasAny) return false;
          }
        }

        return true;
      };

      const filteredItems = items.filter(filterItems);

      if (originalFormat === 'rss' || originalFormat === 'rdf' || originalFormat === 'json') {
        feedData.items = filteredItems;
      } else if (originalFormat === 'atom') {
        feedData.entries = filteredItems;
      }

      try {
        let textResult = '';
        let contentType = 'application/xml';

        if (originalFormat === 'atom') {
          textResult = generateAtomFeed(feedData);
          contentType = 'application/atom+xml';
        } else if (originalFormat === 'json') {
          textResult = generateJsonFeed(feedData) as string;
          contentType = 'application/feed+json';
        } else {
          textResult = generateRssFeed(feedData);
          contentType = 'application/rss+xml';
        }
        return c.text(textResult, 200, { 'Content-Type': contentType as string });
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
