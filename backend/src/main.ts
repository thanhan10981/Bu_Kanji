import { createApp } from './bootstrap';

async function bootstrap() {
  const app = await createApp();
  await app.listen(Number(process.env.PORT) || 3001, '0.0.0.0');
}

void bootstrap();