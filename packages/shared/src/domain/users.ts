import { z } from 'zod';
import { userRoleSchema } from '../auth.js';

/** Correo opcional: el formulario puede enviar cadena vacía. */
const optionalEmail = z
  .union([z.literal(''), z.email('El correo no es válido')])
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .optional();

/** Puesto opcional: el formulario puede enviar cadena vacía. */
const optionalId = z
  .union([z.literal(''), z.string().trim().min(1)])
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .optional();

export const userListItemSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.email().nullable(),
  fullName: z.string(),
  role: userRoleSchema,
  jobPositionId: z.string().nullable(),
  jobPositionCode: z.string().nullable(),
  jobPositionName: z.string().nullable(),
  processId: z.string().nullable(),
  processCode: z.string().nullable(),
  processName: z.string().nullable(),
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
});
export type UserListItem = z.infer<typeof userListItemSchema>;

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario es demasiado largo')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Solo se permiten letras, números, punto, guion y guion bajo'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(72, 'La contraseña es demasiado larga'),
  fullName: z.string().trim().min(2, 'El nombre es obligatorio').max(120),
  email: optionalEmail,
  role: userRoleSchema,
  jobPositionId: optionalId,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    email: optionalEmail,
    role: userRoleSchema.optional(),
    jobPositionId: optionalId,
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Envía al menos un campo para actualizar',
  });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(72, 'La contraseña es demasiado larga'),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const userIdParamSchema = z.object({
  id: z.string().trim().min(1, 'El identificador del usuario es obligatorio'),
});
