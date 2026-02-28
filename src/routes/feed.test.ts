import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { feedRoute } from './feed.js';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';

// Mock test RSS
const mockRssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Test Feed</title>
  <link>https://example.com</link>
  <description>A test feed</description>
  <item>
    <title>Hello Typescript</title>
    <description>This is a post about TS</description>
  </item>
  <item>
    <title>Learning Rust</title>
    <description>Rust is safe and fast</description>
  </item>
  <item>
    <title>Typescript and Rust</title>
    <description>Two great languages. Also an ad.</description>
  </item>
</channel>
</rss>`;

// We will mock global fetch
const originalFetch = global.fetch;

describe('GET /feed route', () => {
  const app = new Hono();
  app.route('/feed', feedRoute);

  beforeAll(() => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === 'https://example.com/feed.xml') {
        return new Response(mockRssXml, { status: 200, headers: { 'Content-Type': 'application/xml' } });
      }
      return new Response('Not Found', { status: 404 });
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('validates query params', async () => {
    const res = await app.request('/feed');
    expect(res.status).toBe(400);
  });

  it('fetches and returns original format', async () => {
    const res = await app.request('/feed?url=https://example.com/feed.xml');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Hello Typescript');
    expect(text).toContain('Learning Rust');
    expect(text).toContain('Typescript and Rust');
  });

  it('filters with include and match=any', async () => {
    const res = await app.request('/feed?url=https://example.com/feed.xml&include=typescript');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Hello Typescript');
    expect(text).toContain('Typescript and Rust');
    expect(text).not.toContain('Learning Rust');
  });

  it('filters with case sensitivity', async () => {
    // case_sensitive=true and 'typescript' should NOT match 'Typescript'
    const res = await app.request('/feed?url=https://example.com/feed.xml&include=typescript&case_sensitive=true');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain('<title>Hello Typescript</title>');
    expect(text).not.toContain('<title>Typescript and Rust</title>');

    const res2 = await app.request('/feed?url=https://example.com/feed.xml&include=Typescript&case_sensitive=true');
    expect(res2.status).toBe(200);
    const text2 = await res2.text();
    expect(text2).toContain('Hello Typescript');
    expect(text2).toContain('Typescript and Rust');
  });

  it('filters with include and match=all', async () => {
    const res = await app.request('/feed?url=https://example.com/feed.xml&include=typescript,rust&match=all');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain('<title>Hello Typescript</title>');
    expect(text).not.toContain('<title>Learning Rust</title>');
    expect(text).toContain('Typescript and Rust');
  });

  it('filters with exclude', async () => {
    const res = await app.request('/feed?url=https://example.com/feed.xml&include=typescript&exclude=ad');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Hello Typescript');
    expect(text).not.toContain('Typescript and Rust');
  });
});
