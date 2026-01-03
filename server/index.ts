import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AuthEnv } from './middleware/auth';
import { chatRoute } from './routes/chat';

const app = new Hono<AuthEnv>();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      'http://localhost:19006',
    ],
    credentials: true,
  }),
);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Routes
app.route('/chat', chatRoute);
app.route('/garmin', garminRoute);

const port = 4000;

console.log(`Agent server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
