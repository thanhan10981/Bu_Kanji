import type { Request, Response } from 'express';
import type { INestApplication } from '@nestjs/common';
import { createApp } from '../src/bootstrap';

let appPromise: Promise<INestApplication> | undefined;

export default async function handler(request: Request, response: Response) {
  appPromise ??= createApp();
  const app = await appPromise;
  return app.getHttpAdapter().getInstance()(request, response);
}
