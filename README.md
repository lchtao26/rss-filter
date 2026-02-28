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
BASE="https://rss-filter.lichcode.workers.dev/feed"
FEED="https://hnrss.org/newest"

# include: match any of the comma-separated keywords (default match=any)
curl "$BASE?url=$FEED&include=typescript,rust"

# match=all: item must contain every keyword
curl "$BASE?url=$FEED&include=node,performance&match=all"

# exclude: drop items matching any of these keywords
curl "$BASE?url=$FEED&include=AI&exclude=sponsored,ad"

# fields: restrict keyword search to title only (default: title,description,content)
curl "$BASE?url=$FEED&include=rust&fields=title"

# format=rss: return RSS XML instead of JSON
curl "$BASE?url=$FEED&include=typescript&format=rss"

# case_sensitive=true: keyword casing must match exactly
curl "$BASE?url=$FEED&include=TypeScript&case_sensitive=true"
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
- **RSS Parsing:** feedsmith (RSS 2.0, Atom, JSON Feed)
- **Testing:** Vitest
