import type { INestApplication } from '@nestjs/common';
import { json, raw } from 'express';

export function configureBodyParsers(app: INestApplication) {
  app.use('/api/ai/imports/:id/parts/:index', raw({ type: 'application/octet-stream', limit: 2 * 1024 * 1024 }));
  app.use('/api/ai/imports/:id/batches/:index', json({ limit: '1mb' }));
  app.use('/api/vocabulary/sets/:id/import', json({ limit: '1mb' }));
  // Nest detects parser functions by name, including route-scoped jsonParser.
  // Register a global fallback explicitly or every other JSON route gets an
  // undefined body (including import creation and authentication endpoints).
  app.use(json({ limit: '100kb' }));
}
