# RSS Filter API

A REST API that proxies and filters RSS/Atom feeds by keywords, with flexible include/exclude and AND/OR logic.

## Usage

### Endpoint

```
GET /feed
```

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | Remote RSS/Atom feed URL to proxy and filter |
| `include` | No | Comma-separated keywords; items must match at least one |
| `exclude` | No | Comma-separated keywords; items matching any are removed |
| `match` | No | `any` (OR, default) or `all` (AND) for `include` terms |
| `fields` | No | Fields to search: `title`, `description`, `content` (default: all three) |
| `case_sensitive` | No | `true` or `false` (default: `false`) |
| `format` | No | `json` (default) or `rss` |

### Examples

```bash
# Filter for TypeScript or Rust articles (OR logic)
curl "https://rss-filter.<your-account>.workers.dev/feed?url=https://hnrss.org/newest&include=typescript,rust&match=any"

# Require both "node" AND "bun" in the same article (AND logic)
curl "https://rss-filter.<your-account>.workers.dev/feed?url=https://hnrss.org/newest&include=node,bun&match=all"

# Include AI articles, but exclude sponsored ones
curl "https://rss-filter.<your-account>.workers.dev/feed?url=https://hnrss.org/newest&include=AI&exclude=sponsored"

# Search only in the title field
curl "https://rss-filter.<your-account>.workers.dev/feed?url=https://hnrss.org/newest&include=rust&fields=title"

# Return filtered results as RSS XML
curl "https://rss-filter.<your-account>.workers.dev/feed?url=https://hnrss.org/newest&include=typescript&format=rss"

# Case-sensitive keyword matching
curl "https://rss-filter.<your-account>.workers.dev/feed?url=https://hnrss.org/newest&include=TypeScript&case_sensitive=true"
```

## Deployment

### Cloudflare Workers

```bash
pnpm wrangler deploy
```

Your API will be available at `https://rss-filter.<your-account>.workers.dev/feed`.

The Worker is configured in `wrangler.toml` with entry point `src/worker.ts`.

## Development

```bash
pnpm install
pnpm dev        # runs on http://localhost:3015
pnpm test
pnpm build && pnpm start
```

## Stack

- **Runtime:** Node.js
- **Framework:** Hono (TypeScript-first)
- **RSS Parsing:** feedsmith (RSS 2.0, Atom, JSON Feed)
- **Testing:** Vitest
