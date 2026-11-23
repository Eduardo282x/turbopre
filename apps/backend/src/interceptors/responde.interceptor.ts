import {
  HttpStatus,
  Injectable,
  StreamableFile,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ApiSuccess } from '@turbopre/shared';
import { map, type Observable } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '../common/decorators/api-message.decorator.js';

const DEFAULT_SUCCESS_MESSAGE = 'Operación exitosa';

/**
 * Envuelve todas las respuestas exitosas de la API en:
 * { success: true, statusCode, message, data }
 *
 * - StreamableFile y Buffer se devuelven sin envolver.
 * - 204 y 304 no llevan cuerpo.
 * - Si un controlador ya devolvió el sobre completo, no se vuelve a envolver.
 *
 * Para personalizar el mensaje usa `@ApiMessage('...')` en el handler.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const response = http.getResponse<{ statusCode: number; headersSent: boolean }>();

    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_SUCCESS_MESSAGE;

    return next.handle().pipe(
      map((data: unknown) => {
        if (
          response.headersSent ||
          data instanceof StreamableFile ||
          Buffer.isBuffer(data)
        ) {
          return data;
        }

        const statusCode = response.statusCode;

        if (statusCode === HttpStatus.NO_CONTENT || statusCode === HttpStatus.NOT_MODIFIED) {
          return data;
        }

        if (isApiSuccess(data)) {
          return data;
        }

        return {
          success: true,
          statusCode,
          message,
          data: data ?? null,
        } satisfies ApiSuccess<unknown>;
      }),
    );
  }
}

function isApiSuccess(value: unknown): value is ApiSuccess<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    record.success === true &&
    typeof record.statusCode === 'number' &&
    typeof record.message === 'string' &&
    'data' in record
  );
}
