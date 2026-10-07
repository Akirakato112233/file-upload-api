import express from 'express';
import { fileURLToPath } from 'node:url';
import { createFileRouter } from './routes/files.js';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp({ uploadDir = fileURLToPath(new URL('../uploads/', import.meta.url)) } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); next(); });
  app.get('/', (_req, res) => res.json({ name: 'File Upload API', version: '1.0.0', files: '/api/files' }));
  app.use('/api/files', createFileRouter(uploadDir));
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(errorHandler);
  return app;
}
