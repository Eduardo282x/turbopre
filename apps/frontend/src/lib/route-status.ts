import type { RouteSheetStatus } from '@turbopre/shared';

type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent';

export const ROUTE_SHEET_STATUS_ORDER: RouteSheetStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'RELEASED',
  'IN_PROGRESS',
  'PENDING_ANNEX_REVIEW',
  'PENDING_QUALITY_APPROVAL',
  'COMPLETED',
];

export const ROUTE_SHEET_STATUS_META: Record<
  RouteSheetStatus,
  { label: string; shortLabel: string; tone: Tone; description: string }
> = {
  DRAFT: {
    label: 'Borrador',
    shortLabel: 'Borrador',
    tone: 'neutral',
    description: 'En preparación por Ingeniería.',
  },
  PENDING_APPROVAL: {
    label: 'Pendiente de aprobación',
    shortLabel: 'Por aprobar',
    tone: 'warning',
    description: 'Espera la aprobación del Gerente.',
  },
  RELEASED: {
    label: 'Liberada',
    shortLabel: 'Liberada',
    tone: 'info',
    description: 'Aprobada y disponible para ejecución en taller.',
  },
  IN_PROGRESS: {
    label: 'En ejecución',
    shortLabel: 'Ejecución',
    tone: 'accent',
    description: 'Tareas en curso en los puestos de trabajo.',
  },
  PENDING_ANNEX_REVIEW: {
    label: 'En revisión de anexos',
    shortLabel: 'Anexos',
    tone: 'warning',
    description: 'Ingeniería selecciona las evidencias finales.',
  },
  PENDING_QUALITY_APPROVAL: {
    label: 'Pendiente de Calidad',
    shortLabel: 'Calidad',
    tone: 'warning',
    description: 'Espera el visto bueno final de Calidad.',
  },
  COMPLETED: {
    label: 'Completada',
    shortLabel: 'Completada',
    tone: 'success',
    description: 'Aprobada por Calidad. Lista para entrega al cliente.',
  },
  CANCELLED: {
    label: 'Cancelada',
    shortLabel: 'Cancelada',
    tone: 'danger',
    description: 'La hoja fue cancelada.',
  },
};
