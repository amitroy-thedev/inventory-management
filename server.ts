import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initDatabase } from './src/lib/db';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function startServer() {
  console.log('[Server] Initializing database schema...');
  try {
    await initDatabase();
    console.log('[Server] Database initialized successfully!');
  } catch (err) {
    console.error('[Server] Failed to initialize database:', err);
  }

  console.log('[Server] Preparing Next.js application...');
  await app.prepare();

  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('[Server] Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      console.error('[Server] Next.js Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`[Server] Pure Next.js Server listening on http://${hostname}:${port}`);
    });
}

startServer();
