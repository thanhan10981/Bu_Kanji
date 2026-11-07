import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { json } from 'express';
import { AppModule } from './app.module';

export async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : undefined });
  const allowedOrigins = (process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL ?? 'http://localhost:3000').split(',').map(origin => origin.trim()).filter(Boolean);

  app.use(cookieParser());
  // A validated batch of 200 Japanese/Vietnamese cards can exceed 100 KB.
  app.use('/api/vocabulary/sets/:id/import', json({ limit: '1mb' }));
  app.use((request: Request, response: Response, next: NextFunction) => {
    response.setHeader('Cache-Control', 'private, no-store');
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const origin = request.headers.origin;
      if (origin && !allowedOrigins.includes(origin)) return response.status(403).json({ message: 'Origin không được phép.' });
    }
    next();
  });
  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.init();
  return app;
}
