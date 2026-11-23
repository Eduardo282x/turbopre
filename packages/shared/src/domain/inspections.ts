import { z } from 'zod';
import {
  inspectionStatusSchema,
  prioritySchema,
  processKindSchema,
  taskDisplayStatusSchema,
  taskSourceSchema,
  taskStatusSchema,
} from './enums.js';

const optionalText = (max = 2000) =>
  z
    .union([z.literal(''), z.string().trim().max(max)])
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

export const inspectionServiceOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  description: z.string(),
  scope: z.string(),
  priority: prioritySchema,
  dueAt: z.string().nullable(),
  clientName: z.string(),
  siteName: z.string(),
  equipmentCode: z.string(),
  equipmentName: z.string(),
  equipmentSerial: z.string().nullable(),
});
export type InspectionServiceOrder = z.infer<typeof inspectionServiceOrderSchema>;

export const taskRecordSchema = z.object({
  id: z.string(),
  inspectionId: z.string().nullable(),
  routeSheetId: z.string().nullable(),
  jobPositionId: z.string(),
  jobPositionCode: z.string(),
  jobPositionName: z.string(),
  processId: z.string(),
  processCode: z.string(),
  processName: z.string(),
  processKind: processKindSchema,
  assignedToId: z.string().nullable(),
  assignedToName: z.string().nullable(),
  createdById: z.string(),
  createdByName: z.string(),
  stage: z.number().int(),
  sequence: z.number().int().nullable(),
  source: taskSourceSchema,
  description: z.string(),
  criteria: z.string().nullable(),
  formRef: z.string().nullable(),
  status: taskStatusSchema,
  displayStatus: taskDisplayStatusSchema,
  blocked: z.boolean(),
  requiresEvidence: z.boolean(),
  estimatedMinutes: z.number().int().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  notes: z.string().nullable(),
  evidenceUrl: z.string().nullable(),
  annexSelected: z.boolean().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TaskRecord = z.infer<typeof taskRecordSchema>;

export const inspectionRecordSchema = z.object({
  id: z.string(),
  code: z.string(),
  serviceOrderId: z.string(),
  serviceOrder: inspectionServiceOrderSchema,
  status: inspectionStatusSchema,
  technicalDetails: z.string().nullable(),
  createdBy: z.object({ id: z.string(), name: z.string() }),
  approvedBy: z.object({ id: z.string(), name: z.string() }).nullable(),
  approvedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  tasks: z.array(taskRecordSchema),
  progress: z.number().int().min(0).max(100),
  completedTasks: z.number().int(),
  totalTasks: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type InspectionRecord = z.infer<typeof inspectionRecordSchema>;

export const createTaskInputSchema = z.object({
  stage: z.number().int().min(1, 'La etapa debe ser al menos 1').default(1),
  jobPositionId: z.string().trim().min(1, 'Selecciona el puesto de trabajo'),
  assignedToId: z.string().trim().min(1).nullable().optional(),
  description: z.string().trim().min(3, 'Describe la tarea').max(2000),
  criteria: optionalText(120),
  formRef: optionalText(120),
  requiresEvidence: z.boolean().default(true),
  estimatedMinutes: z.number().int().min(0).nullable().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z
  .object({
    stage: z.number().int().min(1).optional(),
    jobPositionId: z.string().trim().min(1).optional(),
    assignedToId: z.string().trim().min(1).nullable().optional(),
    description: z.string().trim().min(3).max(2000).optional(),
    criteria: optionalText(120),
    formRef: optionalText(120),
    requiresEvidence: z.boolean().optional(),
    estimatedMinutes: z.number().int().min(0).nullable().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Envía al menos un campo para actualizar',
  });
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

export const createInspectionSchema = z.object({
  serviceOrderId: z.string().trim().min(1, 'Selecciona la orden de servicio'),
  technicalDetails: optionalText(4000),
  tasks: z.array(createTaskInputSchema).min(1, 'Agrega al menos una tarea de inspección'),
});
export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;

export const updateInspectionSchema = z.object({
  technicalDetails: optionalText(4000),
});
export type UpdateInspectionInput = z.infer<typeof updateInspectionSchema>;

export const rejectInspectionSchema = z.object({
  reason: z.string().trim().min(2, 'Escribe el motivo del rechazo').max(1000),
});
export type RejectInspectionInput = z.infer<typeof rejectInspectionSchema>;

export const completeTaskInputSchema = z.object({
  observations: optionalText(1000),
  evidenceUrl: z.string().trim().min(1).nullable().optional(),
});
export type CompleteTaskInput = z.infer<typeof completeTaskInputSchema>;

export const inspectionQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: inspectionStatusSchema.optional(),
  serviceOrderId: z.string().trim().optional(),
});

export const taskContextSchema = z.object({
  task: taskRecordSchema,
  inspection: z
    .object({
      id: z.string(),
      code: z.string(),
      status: inspectionStatusSchema,
      serviceOrder: inspectionServiceOrderSchema,
    })
    .nullable(),
  routeSheet: z
    .object({
      id: z.string(),
      code: z.string(),
      status: z.string(),
    })
    .nullable(),
});
export type TaskContext = z.infer<typeof taskContextSchema>;
