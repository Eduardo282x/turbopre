import { z } from 'zod';
import {
  attachmentTypeSchema,
  inspectionStatusSchema,
  prioritySchema,
  reviewDecisionSchema,
  reviewStageSchema,
  routeSheetStatusSchema,
} from './enums.js';
import { createTaskInputSchema, taskRecordSchema } from './inspections.js';

const optionalText = (max = 2000) =>
  z
    .union([z.literal(''), z.string().trim().max(max)])
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

export const routeSheetServiceOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  description: z.string(),
  scope: z.string(),
  priority: prioritySchema,
  dueAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  clientName: z.string(),
  siteName: z.string(),
  equipmentCode: z.string(),
  equipmentName: z.string(),
  equipmentSerial: z.string().nullable(),
});
export type RouteSheetServiceOrder = z.infer<typeof routeSheetServiceOrderSchema>;

export const routeSheetInspectionSchema = z.object({
  id: z.string(),
  code: z.string(),
  status: inspectionStatusSchema,
});

export const routeSheetReviewRecordSchema = z.object({
  id: z.string(),
  stage: reviewStageSchema,
  decision: reviewDecisionSchema,
  comments: z.string().nullable(),
  reviewer: z.object({ id: z.string(), name: z.string() }),
  createdAt: z.string(),
});
export type RouteSheetReviewRecord = z.infer<typeof routeSheetReviewRecordSchema>;

export const routeSheetProcessSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
});

export const routeSheetDocumentRecordSchema = z.object({
  id: z.string(),
  url: z.string(),
  type: attachmentTypeSchema,
  uploadedBy: z.object({ id: z.string(), name: z.string() }),
  createdAt: z.string(),
});
export type RouteSheetDocumentRecord = z.infer<
  typeof routeSheetDocumentRecordSchema
>;

export const routeSheetRecordSchema = z.object({
  id: z.string(),
  code: z.string(),
  status: routeSheetStatusSchema,
  notes: z.string().nullable(),
  serviceOrder: routeSheetServiceOrderSchema,
  inspection: routeSheetInspectionSchema.nullable(),
  createdBy: z.object({ id: z.string(), name: z.string() }),
  releasedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tasks: z.array(taskRecordSchema),
  reviews: z.array(routeSheetReviewRecordSchema),
  documents: z.array(routeSheetDocumentRecordSchema),
  progress: z.number().int().min(0).max(100),
  completedTasks: z.number().int(),
  totalTasks: z.number().int(),
  currentStage: z.number().int().nullable(),
  activeProcess: routeSheetProcessSchema.nullable(),
});
export type RouteSheetRecord = z.infer<typeof routeSheetRecordSchema>;

export const createRouteSheetSchema = z.object({
  inspectionId: z.string().trim().min(1, 'Selecciona la inspección de origen'),
  notes: optionalText(4000),
  tasks: z.array(createTaskInputSchema).min(1, 'Agrega al menos una tarea a la hoja'),
});
export type CreateRouteSheetInput = z.infer<typeof createRouteSheetSchema>;

export const updateRouteSheetSchema = z.object({
  notes: optionalText(4000),
});
export type UpdateRouteSheetInput = z.infer<typeof updateRouteSheetSchema>;

export const replaceRouteTasksSchema = z.object({
  tasks: z.array(createTaskInputSchema).min(1, 'Agrega al menos una tarea a la hoja'),
});
export type ReplaceRouteTasksInput = z.infer<typeof replaceRouteTasksSchema>;

export const routeSheetQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: routeSheetStatusSchema.optional(),
  serviceOrderId: z.string().trim().optional(),
});

export const routeSheetCommentSchema = z.object({
  comments: optionalText(1000),
});
export type RouteSheetCommentInput = z.infer<typeof routeSheetCommentSchema>;

export const routeSheetRejectSchema = z.object({
  reason: z.string().trim().min(2, 'Escribe el motivo').max(1000),
});
export type RouteSheetRejectInput = z.infer<typeof routeSheetRejectSchema>;

export const annexSelectionSchema = z.object({
  selected: z.boolean(),
});
export type AnnexSelectionInput = z.infer<typeof annexSelectionSchema>;
