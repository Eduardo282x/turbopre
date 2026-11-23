import type {
  InspectionStatus,
  RouteSheetStatus,
  ServiceOrderStatus,
  ServiceOrderWorkflowStatus,
  TaskStatus,
} from './enums.js';

/**
 * Reglas de flujo compartidas entre API y frontend.
 *
 * La API es la dueña de las transiciones; el frontend usa los mismos helpers
 * para habilitar botones y calcular progreso sin duplicar reglas.
 */

export const SERVICE_ORDER_TRANSITIONS: Record<
  ServiceOrderStatus,
  readonly ServiceOrderStatus[]
> = {
  OPEN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['READY_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

export const INSPECTION_TRANSITIONS: Record<
  InspectionStatus,
  readonly InspectionStatus[]
> = {
  OPEN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: ['IN_PROGRESS'],
  CANCELLED: [],
};

export const ROUTE_SHEET_TRANSITIONS: Record<
  RouteSheetStatus,
  readonly RouteSheetStatus[]
> = {
  DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['RELEASED', 'DRAFT', 'CANCELLED'],
  RELEASED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['PENDING_ANNEX_REVIEW', 'CANCELLED'],
  PENDING_ANNEX_REVIEW: ['PENDING_QUALITY_APPROVAL', 'IN_PROGRESS', 'CANCELLED'],
  PENDING_QUALITY_APPROVAL: ['COMPLETED', 'IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const TASK_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  PENDING: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionServiceOrder(
  from: ServiceOrderStatus,
  to: ServiceOrderStatus,
): boolean {
  return SERVICE_ORDER_TRANSITIONS[from].includes(to);
}

export function canTransitionInspection(
  from: InspectionStatus,
  to: InspectionStatus,
): boolean {
  return INSPECTION_TRANSITIONS[from].includes(to);
}

export function canTransitionRouteSheet(
  from: RouteSheetStatus,
  to: RouteSheetStatus,
): boolean {
  return ROUTE_SHEET_TRANSITIONS[from].includes(to);
}

export interface TaskProgressInput {
  status: TaskStatus;
  stage: number;
}

export interface TaskProgress {
  total: number;
  completed: number;
  percent: number;
}

export function computeTaskProgress(tasks: readonly TaskProgressInput[]): TaskProgress {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
  return {
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

/** Devuelve la primera etapa que aún tiene tareas sin completar. */
export function getCurrentStage(tasks: readonly TaskProgressInput[]): number | undefined {
  if (tasks.length === 0) return undefined;

  const stages = [...new Set(tasks.map((task) => task.stage))].sort((a, b) => a - b);

  return stages.find((stage) =>
    tasks.some((task) => task.stage === stage && task.status !== 'COMPLETED'),
  );
}

/**
 * Una tarea está bloqueada si alguna etapa anterior tiene tareas sin completar.
 * Las tareas completadas o canceladas nunca se consideran bloqueadas.
 */
export function isTaskBlocked(
  tasks: readonly TaskProgressInput[],
  task: TaskProgressInput,
): boolean {
  if (task.status === 'COMPLETED' || task.status === 'CANCELLED') return false;

  const previousStages = [...new Set(tasks.map((item) => item.stage))].filter(
    (stage) => stage < task.stage,
  );

  return previousStages.some((stage) =>
    tasks.some((item) => item.stage === stage && item.status !== 'COMPLETED'),
  );
}

export interface WorkflowInput {
  status: ServiceOrderStatus;
  inspectionStatus?: InspectionStatus | null;
  routeSheetStatus?: RouteSheetStatus | null;
}

/**
 * Traduce el estado almacenado de la ODS y sus relaciones al estado detallado
 * que se muestra en pantalla.
 */
export function deriveServiceOrderWorkflowStatus(
  input: WorkflowInput,
): ServiceOrderWorkflowStatus {
  if (input.status === 'CANCELLED') return 'CANCELLED';
  if (input.status === 'DELIVERED' || input.status === 'CLOSED') return 'DELIVERED';
  if (input.status === 'READY_FOR_DELIVERY') return 'READY_FOR_DELIVERY';

  if (input.routeSheetStatus) {
    switch (input.routeSheetStatus) {
      case 'COMPLETED':
        return 'READY_FOR_DELIVERY';
      case 'PENDING_QUALITY_APPROVAL':
        return 'IN_QUALITY';
      case 'PENDING_ANNEX_REVIEW':
        return 'IN_ANNEXES';
      case 'IN_PROGRESS':
      case 'RELEASED':
        return 'IN_EXECUTION';
      case 'DRAFT':
      case 'PENDING_APPROVAL':
        return 'IN_ROUTE';
      case 'CANCELLED':
        return 'CANCELLED';
    }
  }

  if (input.inspectionStatus === 'APPROVED') return 'INSPECTION_APPROVED';
  if (input.inspectionStatus) return 'IN_INSPECTION';

  if (input.status === 'IN_PROGRESS') return 'IN_EXECUTION';

  return 'RECEIVED';
}
