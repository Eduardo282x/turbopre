import { z } from 'zod';
import { equipmentTypeSchema } from './clients.js';
import {
  inspectionStatusSchema,
  prioritySchema,
  serviceOrderStatusSchema,
  serviceOrderWorkflowStatusSchema,
} from './enums.js';

const optionalDate = z
  .union([z.literal(''), z.string().trim().min(1)])
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .optional();

const optionalId = z
  .union([z.literal(''), z.string().trim().min(1)])
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .optional();

const optionalText = (max = 4000) =>
  z
    .union([z.literal(''), z.string().trim().max(max)])
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

export const serviceOrderClientSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
});
export type ServiceOrderClient = z.infer<typeof serviceOrderClientSchema>;

export const serviceOrderSiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable(),
});
export type ServiceOrderSite = z.infer<typeof serviceOrderSiteSchema>;

export const serviceOrderEquipmentSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  manufacturer: z.string().nullable(),
  model: z.string().nullable(),
  serialNumber: z.string().nullable(),
  type: equipmentTypeSchema,
});
export type ServiceOrderEquipment = z.infer<typeof serviceOrderEquipmentSchema>;

export const serviceOrderUserSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type ServiceOrderUser = z.infer<typeof serviceOrderUserSchema>;

export const serviceOrderProjectSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
});
export type ServiceOrderProject = z.infer<typeof serviceOrderProjectSchema>;

export const serviceOrderRecordSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  parentServiceOrderId: z.string().nullable(),
  parentOrderNumber: z.string().nullable(),
  project: serviceOrderProjectSchema.nullable(),
  client: serviceOrderClientSchema,
  site: serviceOrderSiteSchema,
  equipment: serviceOrderEquipmentSchema,
  createdBy: serviceOrderUserSchema,
  description: z.string(),
  scope: z.string(),
  priority: prioritySchema,
  status: serviceOrderStatusSchema,
  workflowStatus: serviceOrderWorkflowStatusSchema,
  inspectionStatus: inspectionStatusSchema.nullable(),
  requestedAt: z.string(),
  dueAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  notes: z.string().nullable(),
  progress: z.number().int().min(0).max(100),
  inspectionId: z.string().nullable(),
  routeSheetId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ServiceOrderRecord = z.infer<typeof serviceOrderRecordSchema>;

export const createServiceOrderSchema = z.object({
  clientId: z.string().trim().min(1, 'Selecciona un cliente'),
  siteId: z.string().trim().min(1, 'Selecciona un sitio'),
  equipmentId: z.string().trim().min(1, 'Selecciona un equipo'),
  description: z.string().trim().min(3, 'Describe el trabajo solicitado').max(2000),
  scope: z.string().trim().min(3, 'Indica el alcance').max(2000),
  priority: prioritySchema.default('MEDIUM'),
  dueAt: optionalDate,
  projectId: optionalId,
  parentServiceOrderId: optionalId,
  notes: optionalText(),
});
export type CreateServiceOrderInput = z.infer<typeof createServiceOrderSchema>;

export const updateServiceOrderSchema = z
  .object({
    siteId: z.string().trim().min(1).optional(),
    equipmentId: z.string().trim().min(1).optional(),
    description: z.string().trim().min(3).max(2000).optional(),
    scope: z.string().trim().min(3).max(2000).optional(),
    priority: prioritySchema.optional(),
    dueAt: optionalDate,
    projectId: optionalId,
    notes: optionalText(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Envía al menos un campo para actualizar',
  });
export type UpdateServiceOrderInput = z.infer<typeof updateServiceOrderSchema>;

export const serviceOrderQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: serviceOrderStatusSchema.optional(),
  clientId: z.string().trim().optional(),
  priority: prioritySchema.optional(),
});

export const deliverServiceOrderSchema = z.object({
  notes: optionalText(1000),
});
export type DeliverServiceOrderInput = z.infer<typeof deliverServiceOrderSchema>;
