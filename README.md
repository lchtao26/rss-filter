# RSS Filter API

A Node.js + Hono REST API that proxies and filters RSS/Atom feeds by keywords, with flexible include/exclude/AND/OR logic.

## Stack

- **Runtime:** Node.js
- **Framework:** Hono (TypeScript-first, fast)
- **RSS Parsing:** rss-parser (handles RSS 2.0 + Atom)
- **Testing:** Vitest

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Server runs on http://localhost:3000

## Build

```bash
pnpm build
pnpm start
```

## API Usage

### Endpoint

`GET /feed`

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | Remote RSS/Atom feed URL |
| `include` | No | Comma-separated keywords; item must match at least one |
| `exclude` | No | Comma-separated keywords; items matching any are removed |
| `match` | No | `any` (OR, default) or `all` (AND) for `include` terms |
| `fields` | No | Fields to search: `title`, `description`, `content` (default: all three) |
| `case_sensitive` | No | `true` or `false` (default: `false`) |
| `format` | No | `json` (default) or `rss` |

### Examples

```bash
# Filter for TypeScript or Rust articles (OR logic)
curl "http://localhost:3000/feed?url=https://hnrss.org/newest&include=typescript,rust&match=any"

# Filter for articles containing both "node" AND "bun" (AND logic)
curl "http://localhost:3000/feed?url=https://hnrss.org/newest&include=node,bun&match=all"

# Exclude sponsored content
curl "http://localhost:3000/feed?url=https://hnrss.org/newest&include=AI&exclude=sponsored"

# Search only in title
curl "http://localhost:3000/feed?url=https://hnrss.org/newest&include=rust&fields=title"

# Get RSS XML output
curl "http://localhost:3000/feed?url=https://hnrss.org/newest&include=typescript&format=rss"

# Case sensitive search
curl "http://localhost:3000/feed?url=https://hnrss.org/newest&include=TypeScript&case_sensitive=true"
```

## Testing

```bash
pnpm test
```

## Project Structure

```
rss-filter/
├── src/
│   ├── index.ts           # Entry point + server bootstrap
│   ├── routes/
│   │   └── feed.ts        # GET /feed route
│   ├── services/
│   │   ├── fetcher.ts    # Fetch + parse remote RSS feed
│   │   └── filter.ts     # Keyword filtering logic
│   └── types.ts          # Shared types/interfaces
├── package.json
├── tsconfig.json
└── README.md
```
