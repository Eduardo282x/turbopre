import { z } from 'zod';

export const healthSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
  uptime: z.number(),
  timestamp: z.string(),
});
export type HealthStatus = z.infer<typeof healthSchema>;

export const apiErrorSchema = z.object({
  statusCode: z.number(),
  error: z.string().optional(),
  message: z.union([z.string(), z.array(z.string())]),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const apiResponseSchema = <T extends z.ZodType>(data: T) =>
  z.object({
    data,
    message: z.string().optional(),
  });
