import { StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { createCorsOrigin } from './config/cors.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

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
