import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { fetchFeed } from '../services/fetcher';
import { filterFeedItems } from '../services/filter';
import { feedRoute } from './feed';

// Mock the services
vi.mock('../services/fetcher', () => ({
  fetchFeed: vi.fn(),
}));

vi.mock('../services/filter', () => ({
  filterFeedItems: vi.fn(),
}));

const mockFeedsmithResponse = {
  format: 'rss' as const,
  feed: {
    title: 'Test Feed',
    items: [
      { title: 'Test Item', link: 'http://example.com/1', description: 'Test description' },
    ],
  },
};

describe('feedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return filtered items as JSON', async () => {
    vi.mocked(fetchFeed).mockResolvedValue(mockFeedsmithResponse);
    vi.mocked(filterFeedItems).mockReturnValue(mockFeedsmithResponse.feed.items);

    const app = new Hono().route('/feed', feedRoute);
    const res = await app.request('/feed?url=http://example.com/rss&format=json&include=test');

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.feed).toBeDefined();
    expect(fetchFeed).toHaveBeenCalledWith('http://example.com/rss');
  });

  it('should return filtered items as RSS XML', async () => {
    vi.mocked(fetchFeed).mockResolvedValue(mockFeedsmithResponse);
    vi.mocked(filterFeedItems).mockReturnValue(mockFeedsmithResponse.feed.items);

    const app = new Hono().route('/feed', feedRoute);
    const res = await app.request('/feed?url=http://example.com/rss&format=rss&include=test');

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('<rss');
    expect(text).toContain('<item>');
  });

  it('should pass filter params to filterFeedItems', async () => {
    vi.mocked(fetchFeed).mockResolvedValue(mockFeedsmithResponse);
    vi.mocked(filterFeedItems).mockReturnValue([]);

    const app = new Hono().route('/feed', feedRoute);
    await app.request('/feed?url=http://example.com/rss&include=typescript,rust&match=all&exclude=sponsored');

    expect(filterFeedItems).toHaveBeenCalledWith(mockFeedsmithResponse.feed.items, {
      include: 'typescript,rust',
      match: 'all',
      exclude: 'sponsored',
      fields: ['title', 'description', 'content'],
      case_sensitive: false,
    });
  });

  it('should return 400 for missing url', async () => {
    const app = new Hono().route('/feed', feedRoute);
    const res = await app.request('/feed?include=test');

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('url');
  });

  it('should parse fields parameter correctly', async () => {
    vi.mocked(fetchFeed).mockResolvedValue(mockFeedsmithResponse);
    vi.mocked(filterFeedItems).mockReturnValue(mockFeedsmithResponse.feed.items);

    const app = new Hono().route('/feed', feedRoute);
    await app.request('/feed?url=http://example.com/rss&fields=title,description&include=test');

    expect(filterFeedItems).toHaveBeenCalledWith(mockFeedsmithResponse.feed.items, expect.objectContaining({
      fields: ['title', 'description'],
    }));
  });

  it('should return 400 for invalid url format', async () => {
    vi.mocked(fetchFeed).mockResolvedValue(mockFeedsmithResponse);

    const app = new Hono().route('/feed', feedRoute);
    const res = await app.request('/feed?url=not-a-url');

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid URL');
  });
});
