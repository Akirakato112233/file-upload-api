import express from 'express';
import { fileURLToPath } from 'node:url';
import { createFileRouter } from './routes/files.js';
import { createProductRouter } from './routes/products.js';
import { swaggerSpec } from './config/swagger.js';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp({ uploadDir = fileURLToPath(new URL('../uploads/', import.meta.url)) } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); next(); });
  app.use(express.json({ limit: '100kb' }));
  app.get('/', (_req, res) => res.json({ name: 'File Upload & Products API', version: '2.0.0', files: '/api/files', products: '/api/products', docs: '/api-docs' }));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
  app.use('/api/files', createFileRouter(uploadDir));
  app.use('/api/products', createProductRouter());
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(errorHandler);
  return app;
}
