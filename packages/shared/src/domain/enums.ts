import { z } from 'zod';

/**
 * Enums canónicos del dominio CAMI.
 *
 * Los nombres son los del esquema Prisma del backend. El frontend consume estos
 * mismos valores y solo traduce las etiquetas visibles al español.
 */

export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type Priority = z.infer<typeof prioritySchema>;
export const PRIORITIES = prioritySchema.options;

export const processKindSchema = z.enum(['WORKSHOP', 'ENGINEERING', 'QUALITY', 'SUPPORT']);
export type ProcessKind = z.infer<typeof processKindSchema>;
export const PROCESS_KINDS = processKindSchema.options;

/** Estado comercial/operativo almacenado de la ODS. */
export const serviceOrderStatusSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'READY_FOR_DELIVERY',
  'DELIVERED',
  'CLOSED',
  'CANCELLED',
]);
export type ServiceOrderStatus = z.infer<typeof serviceOrderStatusSchema>;
export const SERVICE_ORDER_STATUSES = serviceOrderStatusSchema.options;

/**
 * Estado detallado que ve el usuario en pantalla. Se deriva de la ODS, la
 * inspección y la hoja de ruta; no se almacena.
 */
export const serviceOrderWorkflowStatusSchema = z.enum([
  'RECEIVED',
  'IN_INSPECTION',
  'INSPECTION_APPROVED',
  'IN_ROUTE',
  'IN_EXECUTION',
  'IN_ANNEXES',
  'IN_QUALITY',
  'READY_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]);
export type ServiceOrderWorkflowStatus = z.infer<typeof serviceOrderWorkflowStatusSchema>;
export const SERVICE_ORDER_WORKFLOW_STATUSES = serviceOrderWorkflowStatusSchema.options;

export const inspectionStatusSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'COMPLETED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);
export type InspectionStatus = z.infer<typeof inspectionStatusSchema>;
export const INSPECTION_STATUSES = inspectionStatusSchema.options;

export const routeSheetStatusSchema = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'RELEASED',
  'IN_PROGRESS',
  'PENDING_ANNEX_REVIEW',
  'PENDING_QUALITY_APPROVAL',
  'COMPLETED',
  'CANCELLED',
]);
export type RouteSheetStatus = z.infer<typeof routeSheetStatusSchema>;
export const ROUTE_SHEET_STATUSES = routeSheetStatusSchema.options;

/** "BLOCKED" no se almacena: se calcula con la secuencia/etapa. */
export const taskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export const TASK_STATUSES = taskStatusSchema.options;

export const taskDisplayStatusSchema = z.enum([
  'BLOCKED',
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);
export type TaskDisplayStatus = z.infer<typeof taskDisplayStatusSchema>;

export const taskSourceSchema = z.enum(['INSPECTION', 'ROUTE_SHEET']);
export type TaskSource = z.infer<typeof taskSourceSchema>;
export const TASK_SOURCES = taskSourceSchema.options;

export const reviewStageSchema = z.enum([
  'MANAGER_APPROVAL',
  'ANNEX_REVIEW',
  'QUALITY_APPROVAL',
]);
export type ReviewStage = z.infer<typeof reviewStageSchema>;

export const reviewDecisionSchema = z.enum(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED']);
export type ReviewDecision = z.infer<typeof reviewDecisionSchema>;

export const attachmentTypeSchema = z.enum(['PHOTO', 'PDF', 'PLAN', 'CERTIFICATE', 'OTHER']);
export type AttachmentType = z.infer<typeof attachmentTypeSchema>;

export const itemTypeSchema = z.enum(['SPARE_PART', 'CONSUMABLE', 'TOOL', 'EQUIPMENT']);
export type ItemType = z.infer<typeof itemTypeSchema>;

export const inventoryUnitStatusSchema = z.enum([
  'AVAILABLE',
  'LOANED',
  'IN_USE',
  'MAINTENANCE',
  'RETIRED',
]);
export type InventoryUnitStatus = z.infer<typeof inventoryUnitStatusSchema>;

export const stockMovementTypeSchema = z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN']);
export type StockMovementType = z.infer<typeof stockMovementTypeSchema>;

export const materialRequestStatusSchema = z.enum([
  'PENDING',
  'PARTIALLY_FULFILLED',
  'FULFILLED',
  'CANCELLED',
]);
export type MaterialRequestStatus = z.infer<typeof materialRequestStatusSchema>;

export const materialRequestItemStatusSchema = z.enum([
  'PENDING',
  'IN_STOCK',
  'PURCHASE_REQUIRED',
  'PURCHASED',
  'DELIVERED',
  'REJECTED',
]);
export type MaterialRequestItemStatus = z.infer<typeof materialRequestItemStatusSchema>;

export const loanStatusSchema = z.enum(['ACTIVE', 'PARTIALLY_RETURNED', 'RETURNED', 'CANCELLED']);
export type LoanStatus = z.infer<typeof loanStatusSchema>;

export const calibrationResultSchema = z.enum(['PASSED', 'FAILED', 'CONDITIONAL']);
export type CalibrationResult = z.infer<typeof calibrationResultSchema>;

export const projectStatusSchema = z.enum([
  'PLANNED',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export const PROJECT_STATUSES = projectStatusSchema.options;

export const auditActionSchema = z.enum([
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'REJECT',
  'COMPLETE',
  'DELIVER',
  'LOGIN',
  'STATUS_CHANGE',
]);
export type AuditAction = z.infer<typeof auditActionSchema>;
export const AUDIT_ACTIONS = auditActionSchema.options;

export const aiSuggestionStatusSchema = z.enum(['DRAFT', 'ACCEPTED', 'REJECTED']);
export type AiSuggestionStatus = z.infer<typeof aiSuggestionStatusSchema>;
