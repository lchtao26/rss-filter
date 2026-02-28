import type { SearchField } from '../types.js';

export interface FilterOptions {
  include?: string;
  exclude?: string;
  match?: 'any' | 'all';
  fields?: SearchField[];
  case_sensitive?: boolean;
}

function parseFields(fields: string | undefined): SearchField[] {
  if (!fields) return ['title', 'description', 'content'];
  return fields.split(',') as SearchField[];
}

// feedsmith item type - content can be a string or { encoded: string }
type FeedsmithItem = {
  title?: string;
  link?: string;
  description?: string;
  content?: string | { encoded?: string };
  pubDate?: string;
};

function getFieldValue(item: FeedsmithItem, field: SearchField): string {
  switch (field) {
    case 'title':
      return item.title || '';
    case 'description':
      return item.description || '';
    case 'content':
      if (typeof item.content === 'string') {
        return item.content;
      }
      if (item.content && typeof item.content === 'object') {
        return item.content.encoded || '';
      }
      return '';
  }
}

function itemContainsKeyword(item: FeedsmithItem, keyword: string, fields: SearchField[], caseSensitive: boolean): boolean {
  const searchText = caseSensitive ? keyword : keyword.toLowerCase();

  for (const field of fields) {
    const value = caseSensitive ? getFieldValue(item, field) : getFieldValue(item, field).toLowerCase();
    if (value.includes(searchText)) {
      return true;
    }
  }
  return false;
}

export function filterFeedItems(items: FeedsmithItem[], options: FilterOptions): FeedsmithItem[] {
  const { include, exclude, match = 'any', fields: fieldsParam, case_sensitive = false } = options;
  const fields = fieldsParam || ['title', 'description', 'content'];

  let result = [...items];

  // Apply include filter
  if (include) {
    const keywords = include.split(',').map(k => k.trim()).filter(Boolean);

    result = result.filter(item => {
      if (match === 'all') {
        // AND logic: all keywords must be present
        return keywords.every(keyword =>
          itemContainsKeyword(item, keyword, fields, case_sensitive)
        );
      } else {
        // OR logic: at least one keyword must be present
        return keywords.some(keyword =>
          itemContainsKeyword(item, keyword, fields, case_sensitive)
        );
      }
    });
  }

  // Apply exclude filter
  if (exclude) {
    const excludeKeywords = exclude.split(',').map(k => k.trim()).filter(Boolean);

    result = result.filter(item => {
      return !excludeKeywords.some(keyword =>
        itemContainsKeyword(item, keyword, fields, case_sensitive)
      );
    });
  }

  return result;
}
