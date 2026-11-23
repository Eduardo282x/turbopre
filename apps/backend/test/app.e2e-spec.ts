import { StandardSchemaValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';

describe('TurboPre API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
    await app.listen(0);
  });

  afterAll(async () => {
    await app.close();
  });

  it('envuelve el health check en el sobre estándar', async () => {
    const server = app.getHttpServer();
    const response = await fetch(`${await app.getUrl()}/api/health`);

    expect(server).toBeDefined();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      statusCode: 200,
      message: 'Servicio disponible',
      data: {
        status: 'ok',
        service: 'turbopre-api',
      },
    });
  });

  it('envuelve los errores 404', async () => {
    const response = await fetch(`${await app.getUrl()}/api/ruta-inexistente`);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      statusCode: 404,
      message: 'Ruta no encontrada',
      data: null,
    });
  });

  it('protege /auth/me sin token', async () => {
    const response = await fetch(`${await app.getUrl()}/api/auth/me`);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      statusCode: 401,
      message: 'Token de acceso no proporcionado',
      data: null,
    });
  });

  it('devuelve los errores de validación en el sobre estándar', async () => {
    const response = await fetch(`${await app.getUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'ab', password: '123' }),
    });

    expect(response.status).toBe(400);

    const body = (await response.json()) as {
      success: boolean;
      statusCode: number;
      message: string;
      data: { errors?: string[] };
    };

    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(400);
    expect(typeof body.message).toBe('string');
    expect(Array.isArray(body.data.errors)).toBe(true);
  });
});
