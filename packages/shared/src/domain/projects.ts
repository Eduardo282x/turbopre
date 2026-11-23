import { z } from 'zod';
import { projectStatusSchema } from './enums.js';

const optionalDate = z
  .union([z.literal(''), z.string().trim().min(1)])
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .optional();

const optionalText = (max = 1000) =>
  z
    .union([z.literal(''), z.string().trim().max(max)])
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

export const projectRecordSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  clientId: z.string().nullable(),
  clientName: z.string().nullable(),
  managerId: z.string().nullable(),
  managerName: z.string().nullable(),
  status: projectStatusSchema,
  startDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  notes: z.string().nullable(),
  progress: z.number().int().min(0).max(100),
  serviceOrderCount: z.number().int(),
  completedServiceOrderCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProjectRecord = z.infer<typeof projectRecordSchema>;

export const createProjectSchema = z.object({
  code: z.string().trim().min(2).max(40).optional(),
  name: z.string().trim().min(2, 'El nombre es obligatorio').max(160),
  clientId: z.string().trim().min(1).nullable().optional(),
  managerId: z.string().trim().min(1).nullable().optional(),
  status: projectStatusSchema.default('PLANNED'),
  startDate: optionalDate,
  dueDate: optionalDate,
  notes: optionalText(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z
  .object({
    code: z.string().trim().min(2).max(40).optional(),
    name: z.string().trim().min(2).max(160).optional(),
    clientId: z.string().trim().min(1).nullable().optional(),
    managerId: z.string().trim().min(1).nullable().optional(),
    status: projectStatusSchema.optional(),
    startDate: optionalDate,
    dueDate: optionalDate,
    notes: optionalText(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Envía al menos un campo para actualizar',
  });
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const projectQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: projectStatusSchema.optional(),
  clientId: z.string().trim().optional(),
});
