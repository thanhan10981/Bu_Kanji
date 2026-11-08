import { trustedProxies } from './auth/proxy-trust';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { configureBodyParsers } from './body-parsers';

export function configureHttp(app: INestApplication, env: NodeJS.ProcessEnv = process.env) {
  const allowedOrigins = (env.CORS_ORIGIN ?? env.FRONTEND_URL ?? 'http://localhost:3000').split(',').map(origin => origin.trim()).filter(Boolean);

  app.getHttpAdapter().getInstance().set('trust proxy', trustedProxies(env.AUTH_TRUSTED_PROXY_CIDRS));
  app.use(cookieParser());
  configureBodyParsers(app);
  app.use((request: Request, response: Response, next: NextFunction) => {
    response.setHeader('Cache-Control', 'private, no-store');
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const origin = request.headers.origin;
      if (origin && !allowedOrigins.includes(origin)) return response.status(403).json({ message: 'Origin không được phép.' });
    }
    next();
  });
  app.enableCors({ origin: allowedOrigins, credentials: true, exposedHeaders: ['Retry-After'] });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
}

export async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : undefined });
  configureHttp(app);
  await app.init();
  return app;
}
