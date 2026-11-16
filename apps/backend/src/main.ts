import { StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const origins = (config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

  app.setGlobalPrefix('api');
  app.enableCors({ origin: origins, credentials: true });
  app.useGlobalPipes(new StandardSchemaValidationPipe());

  const port = Number(config.get<string>('PORT') ?? 3000);
  await app.listen(port);

  console.log(`TurboPre API escuchando en http://localhost:${port}/api`);
}

await bootstrap();
