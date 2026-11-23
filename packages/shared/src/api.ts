import { z } from 'zod';

/**
 * Sobre estándar de las respuestas exitosas de la API.
 *
 * Todas las rutas responden:
 * { success: true, statusCode, message, data }
 */
export const apiSuccessSchema = <T extends z.ZodType>(data: T) =>
  z.object({
    success: z.literal(true),
    statusCode: z.number().int(),
    message: z.string(),
    data,
  });

export type ApiSuccess<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
};

/**
 * Sobre estándar de las respuestas de error.
 *
 * `data` solo contiene detalles seguros para el cliente (por ejemplo, la lista
 * de errores de validación). Nunca incluye stack traces ni mensajes internos de
 * Prisma.
 */
export const apiErrorSchema = z.object({
  success: z.literal(false),
  statusCode: z.number().int(),
  message: z.string(),
  data: z.unknown(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export const apiResponseSchema = <T extends z.ZodType>(data: T) =>
  z.union([apiSuccessSchema(data), apiErrorSchema]);

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
