import { Hono } from 'hono';
import { feedRoute } from './routes/feed';

const app = new Hono();

app.get('/', (c) =>
  c.json({
    message: 'RSS Filter API',
    endpoints: {
      feed: 'GET /feed?url=<rss-url>&include=...',
    },
  })
);

app.route('/feed', feedRoute);

export default app;
