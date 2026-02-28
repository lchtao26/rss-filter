---
name: RSS Filter URL Builder
overview: Create a standalone static HTML page (`index.html`) that lets users fill out a form and generates a filtered feed URL for the RSS Filter API — no server required, pure HTML/CSS/JS.
todos:
  - id: create-html
    content: Create index.html with form, live URL builder logic, and copy button
    status: pending
isProject: false
---

# RSS Filter URL Builder — Static HTML Page

## Goal

A single `index.html` file (openable directly in a browser via `file://`) with a form that assembles the `/feed` query URL in real-time.

## API Parameters to Cover

All query params from `[src/routes/feed.ts](src/routes/feed.ts)`:

- `url` (required) — RSS/Atom feed URL
- `include` — comma-separated keywords
- `exclude` — comma-separated keywords
- `match` — radio: `any` (default) / `all`
- `fields` — checkboxes: `title`, `description`, `content` (all checked by default)
- `case_sensitive` — toggle: `false` (**default**)
- `format` — radio: `json` (default) / `rss`

## Page Behavior

- The generated URL updates live as the user types (no submit needed)
- A read-only output box shows the full constructed URL (e.g. `https://your-api.workers.dev/feed?url=...&include=...`)
- A "Copy" button copies it to clipboard
- An optional "Base URL" field lets the user set their deployed API root (defaults to `http://localhost:5173`)
- Parameters with default values are omitted from the URL unless changed (to keep URLs clean)

## Output File

- `index.html` at the project root
- No external dependencies — plain HTML + CSS + vanilla JS only
