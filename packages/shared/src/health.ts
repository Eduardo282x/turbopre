import { z } from 'zod';

export const healthSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
  uptime: z.number(),
  timestamp: z.string(),
});
export type HealthStatus = z.infer<typeof healthSchema>;
