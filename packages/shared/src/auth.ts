import { z } from 'zod';

export const userRoleSchema = z.enum(['ADMIN', 'STAFF']);
export type UserRole = z.infer<typeof userRoleSchema>;
export const USER_ROLES = userRoleSchema.options;

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: userRoleSchema,
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const loginSchema = z.object({
  email: z.email('Ingresa un correo electrónico válido'),
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
  name: z.string(),
  email: z.email(),
  role: userRoleSchema,
});
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
