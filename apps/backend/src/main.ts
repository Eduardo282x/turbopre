import { StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { createCorsOrigin } from './config/cors.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Las evidencias de tareas viajan como data URL (máx. 3 MB en el navegador).
  app.useBodyParser('json', { limit: '6mb' });

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: createCorsOrigin(config.get<string>('CORS_ORIGIN')),
    credentials: true,
  });
  app.useGlobalPipes(new StandardSchemaValidationPipe());

  const port = Number(config.get<string>('PORT') ?? 3000);
  await app.listen(port);

  console.log(`TurboPre API escuchando en http://localhost:${port}/api`);
}

await bootstrap();
