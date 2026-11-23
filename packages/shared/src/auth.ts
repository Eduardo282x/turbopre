import { z } from 'zod';

/**
 * Roles del negocio.
 * WORKSHOP es el jefe/supervisor de taller; OPERATOR es el operador que
 * ejecuta tareas en la hoja de ruta.
 */
export const userRoleSchema = z.enum([
  'ADMIN',
  'SALES',
  'WORKSHOP',
  'OPERATOR',
  'ENGINEER',
  'QUALITY',
  'PROJECT_MANAGER',
  'WAREHOUSE',
]);
export type UserRole = z.infer<typeof userRoleSchema>;
export const USER_ROLES = userRoleSchema.options;

export const authUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  email: z.email().nullable(),
  role: userRoleSchema,
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const jwtPayloadSchema = z.object({
  sub: z.string(),
  username: z.string(),
  name: z.string(),
  email: z.email().nullable(),
  role: userRoleSchema,
});
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
