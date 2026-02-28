import { describe, it, expect } from 'vitest';
import { filterFeedItems, type FilterOptions } from './filter';

const mockItems = [
  { title: 'TypeScript 5.0 Released', link: 'http://example.com/1', description: 'New version of TypeScript' },
  { title: 'Rust in 2024', link: 'http://example.com/2', description: 'Rust programming language updates' },
  { title: 'JavaScript Tips', link: 'http://example.com/3', description: 'Tips for JavaScript developers' },
  { title: 'TypeScript and Rust together', link: 'http://example.com/4', description: 'Using both languages' },
];

describe('filterFeedItems', () => {
  it('should return all items when no filters specified', () => {
    const result = filterFeedItems(mockItems, {});
    expect(result).toHaveLength(4);
  });

  it('should filter by include (any) - item matches any keyword', () => {
    const result = filterFeedItems(mockItems, { include: 'typescript', match: 'any' });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.title)).toContain('TypeScript 5.0 Released');
    expect(result.map(r => r.title)).toContain('TypeScript and Rust together');
  });

  it('should filter by include (all) - item must match all keywords', () => {
    const result = filterFeedItems(mockItems, { include: 'typescript,rust', match: 'all' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('TypeScript and Rust together');
  });

  it('should exclude items matching exclude keywords', () => {
    const items = [
      { title: 'TypeScript 5.0 Released', link: 'http://example.com/1', description: 'New version of TypeScript' },
      { title: 'TypeScript in 2024', link: 'http://example.com/2', description: 'TypeScript updates' },
    ];
    const result = filterFeedItems(items, { include: 'typescript', exclude: '2024' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('TypeScript 5.0 Released');
  });

  it('should search in description by default', () => {
    const items = [{ title: 'Test', link: 'http://x.com', description: 'hello world' }];
    const result = filterFeedItems(items, { include: 'world' });
    expect(result).toHaveLength(1);
  });

  it('should search in title when fields includes title', () => {
    const items = [{ title: 'Hello World', link: 'http://x.com', description: 'some text' }];
    const result = filterFeedItems(items, { include: 'hello', fields: ['title'] });
    expect(result).toHaveLength(1);
  });

  it('should be case insensitive by default', () => {
    const items = [{ title: 'TYPESCRIPT', link: 'http://x.com', description: 'test' }];
    const result = filterFeedItems(items, { include: 'typescript' });
    expect(result).toHaveLength(1);
  });

  it('should be case sensitive when case_sensitive is true', () => {
    const items = [{ title: 'TYPESCRIPT', link: 'http://x.com', description: 'test' }];
    const result = filterFeedItems(items, { include: 'typescript', case_sensitive: true });
    expect(result).toHaveLength(0);
  });

  it('should handle content field', () => {
    const items = [{ title: 'Test', link: 'http://x.com', description: 'desc', content: 'full content' }];
    const result = filterFeedItems(items, { include: 'full', fields: ['content'] });
    expect(result).toHaveLength(1);
  });

  it('should handle multiple fields', () => {
    const items = [{ title: 'Test', link: 'http://x.com', description: 'desc', content: 'content' }];
    const result = filterFeedItems(items, { include: 'desc', fields: ['title', 'description'] });
    expect(result).toHaveLength(1);
  });
});
