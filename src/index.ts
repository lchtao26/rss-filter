import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { feedRoute } from './routes/feed.js';

const app = new Hono();

app.get('/', (c) => {
  return c.json({
    message: 'RSS Filter API',
    endpoints: {
      feed: 'GET /feed?url=<rss-url>&include=keyword1,keyword2&exclude=keyword3&match=any|all&fields=title,description,content&case_sensitive=true|false&format=rss|json',
    },
  });
});

app.route('/feed', feedRoute);

const port = parseInt(process.env.PORT || '3015');

console.log(`Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
