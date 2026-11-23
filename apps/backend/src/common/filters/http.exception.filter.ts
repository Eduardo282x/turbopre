import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { ApiError } from '@turbopre/shared';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    username?: string;
    role?: string;
  };
};

type ResolvedError = {
  statusCode: number;
  message: string;
  data: unknown;
  /** Detalle técnico solo para el log del servidor. */
  internalDetail?: string;
};

/**
 * Filtro global de excepciones.
 *
 * Devuelve siempre el mismo sobre que las respuestas exitosas:
 * { success: false, statusCode, message, data }
 *
 * Reglas:
 * - No expone stack traces ni mensajes internos de Prisma al cliente.
 * - `data` solo lleva detalles seguros (por ejemplo, la lista de errores de
 *   validación).
 * - Los errores 5xx se registran con stack; los 4xx solo como advertencia.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<AuthenticatedRequest>();
    const resolved = this.resolve(exception);

    const method = request.method;
    const url = request.originalUrl ?? request.url;
    const userId = request.user?.id;
    const context = `${method} ${url} -> ${resolved.statusCode}: ${resolved.message}${
      userId ? ` | user=${userId}` : ''
    }`;

    if (resolved.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${context}${resolved.internalDetail ? ` | ${resolved.internalDetail}` : ''}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(context);
    }

    if (response.headersSent) {
      return;
    }

    const payload: ApiError = {
      success: false,
      statusCode: resolved.statusCode,
      message: resolved.message,
      data: resolved.data,
    };

    response.status(resolved.statusCode).json(payload);
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        ...this.mapPrismaError(exception),
        data: null,
        internalDetail: `Prisma ${exception.code}: ${exception.message}`,
      };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Los datos enviados no son válidos para la base de datos',
        data: null,
        internalDetail: exception.message,
      };
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'No se pudo conectar con la base de datos',
        data: null,
        internalDetail: exception.message,
      };
    }

    if (exception instanceof Prisma.PrismaClientRustPanicError) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error interno de la base de datos',
        data: null,
        internalDetail: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
      data: null,
      internalDetail: exception instanceof Error ? exception.message : String(exception),
    };
  }

  private fromHttpException(exception: HttpException): ResolvedError {
    const statusCode = exception.getStatus();
    const body = exception.getResponse();
    let message = exception.message;
    let data: unknown = null;

    if (typeof body === 'string') {
      message = body;
    } else if (body !== null && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      const rawMessage = record.message;

      if (Array.isArray(rawMessage)) {
        message = rawMessage.map(String).join('; ');
      } else if (typeof rawMessage === 'string' && rawMessage.length > 0) {
        message = rawMessage;
      }

      const {
        message: _message,
        statusCode: _statusCode,
        error: _error,
        ...rest
      } = record;

      if (Object.keys(rest).length > 0) {
        data = rest;
      }

      if (Array.isArray(rawMessage) && rawMessage.length > 0) {
        data = {
          ...(data !== null && typeof data === 'object' ? data : {}),
          errors: rawMessage,
        };
      }
    }

    if (!message) {
      message = 'Error en la solicitud';
    }

    if (
      statusCode === HttpStatus.NOT_FOUND &&
      /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/.test(message)
    ) {
      message = 'Ruta no encontrada';
    }

    return { statusCode, message, data };
  }

  private mapPrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    message: string;
  } {
    const metaTarget = exception.meta?.target;
    const target = Array.isArray(metaTarget)
      ? metaTarget.map(String).join(', ')
      : typeof metaTarget === 'string'
        ? metaTarget
        : undefined;

    switch (exception.code) {
      case 'P2000':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'El valor enviado es demasiado largo para el campo',
        };
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          message: target
            ? `Ya existe un registro con el mismo valor en: ${target}`
            : 'Ya existe un registro con el mismo valor',
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'La operación viola una relación entre registros',
        };
      case 'P2011':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Un campo obligatorio está vacío',
        };
      case 'P2014':
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'La operación requiere un registro relacionado que no existe',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'El registro solicitado no existe',
        };
      case 'P2028':
        return {
          statusCode: HttpStatus.REQUEST_TIMEOUT,
          message: 'La operación tardó demasiado. Intenta de nuevo',
        };
      case 'P2034':
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Otro usuario modificó el registro al mismo tiempo. Intenta de nuevo',
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno de la base de datos',
        };
    }
  }
}
