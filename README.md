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
# include: match any of the comma-separated keywords (default match=any)
curl "https://rss-filter.lichcode.workers.dev/feed?url=https://hnrss.org/newest&include=typescript,rust"

# match=all: item must contain every keyword
curl "https://rss-filter.lichcode.workers.dev/feed?url=https://hnrss.org/newest&include=node,performance&match=all"

# exclude: drop items matching any of these keywords
curl "https://rss-filter.lichcode.workers.dev/feed?url=https://hnrss.org/newest&include=AI&exclude=sponsored,ad"

# fields: restrict keyword search to title only (default: title,description,content)
curl "https://rss-filter.lichcode.workers.dev/feed?url=https://hnrss.org/newest&include=rust&fields=title"

# format=rss: return RSS XML instead of JSON
curl "https://rss-filter.lichcode.workers.dev/feed?url=https://hnrss.org/newest&include=typescript&format=rss"

# case_sensitive=true: keyword casing must match exactly
curl "https://rss-filter.lichcode.workers.dev/feed?url=https://hnrss.org/newest&include=TypeScript&case_sensitive=true"
```

## Deployment

### Cloudflare Workers

```bash
pnpm wrangler deploy
```

Your API will be available at `https://rss-filter.<your-account>.workers.dev/feed`. Live instance: https://rss-filter.lichcode.workers.dev/feed

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
- **RSS Parsing/Generating:** feedsmith (RSS 2.0, Atom, JSON Feed)
- **Testing:** Vitest
