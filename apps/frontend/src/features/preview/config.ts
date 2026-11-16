import type {
  Area,
  AreaId,
  AuditAction,
  InventoryStatus,
  LoanStatus,
  PartStatus,
  PhaseStatus,
  PhaseType,
  Priority,
  RoleId,
  RouteStatus,
  SparePartStatus,
} from './types';

export const AREAS: Area[] = [
  { id: 'planning', name: 'Planificación y Diseño', shortName: 'Planificación', group: 'planning', order: 1, color: '#8b5cf6' },
  { id: 'engineering', name: 'Ingeniería y Soporte Técnico', shortName: 'Ingeniería', group: 'engineering', order: 2, color: '#00d1ff' },
  { id: 'turbines', name: 'Turbinas (Equipos Rotativos)', shortName: 'Turbinas', group: 'production', order: 3, color: '#f97316' },
  { id: 'machining', name: 'Mecanizado', shortName: 'Mecanizado', group: 'production', order: 4, color: '#3b82f6' },
  { id: 'welding', name: 'Soldadura', shortName: 'Soldadura', group: 'production', order: 5, color: '#22c55e' },
  { id: 'generators', name: 'Generadores', shortName: 'Generadores', group: 'production', order: 6, color: '#eab308' },
  { id: 'workshop', name: 'Servicios de Taller', shortName: 'Taller', group: 'production', order: 7, color: '#14b8a6' },
  { id: 'warehouse', name: 'Almacén', shortName: 'Almacén', group: 'support', order: 8, color: '#ef4444' },
  { id: 'quality', name: 'Control de Calidad', shortName: 'Calidad', group: 'support', order: 9, color: '#ec4899' },
  { id: 'sales', name: 'Mercadeo y Ventas', shortName: 'Ventas', group: 'commercial', order: 10, color: '#d946ef' },
];

export const AREA_BY_ID = Object.fromEntries(AREAS.map((area) => [area.id, area])) as Record<AreaId, Area>;

export const ROLE_OPTIONS: Array<{ id: RoleId; label: string; description: string }> = [
  { id: 'GLOBAL', label: 'Usuario Global', description: 'Visión completa del sistema y administración.' },
  { id: 'PLANNING', label: 'Planificación y Diseño', description: 'Crea hojas de ruta, partes y repuestos.' },
  { id: 'ENGINEERING', label: 'Ingeniería', description: 'Revisa, aprueba y hace seguimiento técnico.' },
  { id: 'SALES', label: 'Ventas', description: 'Consulta estados y compromete entregas.' },
  { id: 'WORKSHOP', label: 'Servicios de Taller', description: 'Coordina inspecciones y ejecución en taller.' },
  { id: 'OPERATOR', label: 'Operador', description: 'Ejecuta fases del área operativa asignada.' },
  { id: 'WAREHOUSE', label: 'Almacén', description: 'Gestiona inventario, solicitudes y préstamos.' },
  { id: 'QUALITY', label: 'Calidad', description: 'Valida el trabajo y da el visto bueno final.' },
];

export const ROLE_BY_ID = Object.fromEntries(ROLE_OPTIONS.map((role) => [role.id, role])) as Record<
  RoleId,
  (typeof ROLE_OPTIONS)[number]
>;

export const ROLE_COLORS: Record<RoleId, string> = {
  GLOBAL: '#a855f7',
  PLANNING: '#8b5cf6',
  ENGINEERING: '#00d1ff',
  SALES: '#d946ef',
  WORKSHOP: '#22c55e',
  OPERATOR: '#ffb020',
  WAREHOUSE: '#14b8a6',
  QUALITY: '#ec4899',
};

export const ROUTE_STATUS_ORDER: RouteStatus[] = [
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'IN_PROGRESS',
  'IN_QUALITY',
  'READY_FOR_DELIVERY',
  'DELIVERED',
];

export const ROUTE_STATUS_META: Record<
  RouteStatus,
  { label: string; shortLabel: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent'; description: string }
> = {
  DRAFT: { label: 'Borrador', shortLabel: 'Borrador', tone: 'neutral', description: 'En preparación por Planificación.' },
  IN_REVIEW: { label: 'En revisión', shortLabel: 'Revisión', tone: 'warning', description: 'Pendiente de aprobación de Ingeniería.' },
  APPROVED: { label: 'Aprobada', shortLabel: 'Aprobada', tone: 'info', description: 'Lista para iniciar ejecución.' },
  IN_PROGRESS: { label: 'En ejecución', shortLabel: 'Ejecución', tone: 'accent', description: 'Fases en curso en las áreas de taller.' },
  IN_QUALITY: { label: 'En calidad', shortLabel: 'Calidad', tone: 'warning', description: 'Pendiente de visto bueno de Calidad.' },
  READY_FOR_DELIVERY: { label: 'Lista para entrega', shortLabel: 'Por entregar', tone: 'success', description: 'Aprobada por Calidad, pendiente de entrega.' },
  DELIVERED: { label: 'Entregada', shortLabel: 'Entregada', tone: 'success', description: 'Entregada al cliente.' },
};

export const PHASE_STATUS_META: Record<
  PhaseStatus,
  { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent' }
> = {
  PENDING: { label: 'Pendiente', tone: 'neutral' },
  IN_PROGRESS: { label: 'En proceso', tone: 'accent' },
  COMPLETED: { label: 'Completada', tone: 'success' },
  BLOCKED: { label: 'Bloqueada', tone: 'danger' },
};

export const PHASE_TYPE_LABELS: Record<PhaseType, string> = {
  WORK: 'Trabajo',
  INSPECTION: 'Inspección',
  QUALITY: 'Calidad',
};

export const PRIORITY_META: Record<Priority, { label: string; tone: 'neutral' | 'info' | 'warning' | 'danger' | 'accent' }> = {
  LOW: { label: 'Baja', tone: 'neutral' },
  MEDIUM: { label: 'Media', tone: 'info' },
  HIGH: { label: 'Alta', tone: 'warning' },
  CRITICAL: { label: 'Crítica', tone: 'danger' },
};

export const PART_STATUS_META: Record<PartStatus, { label: string; tone: 'neutral' | 'info' | 'success' }> = {
  PENDING: { label: 'Pendiente', tone: 'neutral' },
  IN_PROGRESS: { label: 'En proceso', tone: 'info' },
  COMPLETED: { label: 'Completada', tone: 'success' },
};

export const SPARE_PART_STATUS_META: Record<
  SparePartStatus,
  { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' }
> = {
  PENDING: { label: 'Pendiente', tone: 'warning' },
  APPROVED: { label: 'Aprobado', tone: 'info' },
  DISPATCHED: { label: 'Despachado', tone: 'success' },
};

export const INVENTORY_STATUS_META: Record<InventoryStatus, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  AVAILABLE: { label: 'Disponible', tone: 'success' },
  LOANED: { label: 'Prestado', tone: 'warning' },
  OUT_OF_STOCK: { label: 'Sin stock', tone: 'danger' },
};

export const LOAN_STATUS_META: Record<LoanStatus, { label: string; tone: 'success' | 'info' }> = {
  ACTIVE: { label: 'Activo', tone: 'info' },
  RETURNED: { label: 'Devuelto', tone: 'success' },
};

export const AUDIT_ACTION_META: Record<AuditAction, { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent' }> = {
  CREATE: { label: 'Creación', tone: 'success' },
  UPDATE: { label: 'Actualización', tone: 'warning' },
  DELETE: { label: 'Eliminación', tone: 'danger' },
  APPROVE: { label: 'Aprobación', tone: 'success' },
  REJECT: { label: 'Rechazo', tone: 'danger' },
  COMPLETE: { label: 'Completado', tone: 'success' },
  DISPATCH: { label: 'Despacho', tone: 'info' },
  DELIVER: { label: 'Entrega', tone: 'success' },
  LOGIN: { label: 'Ingreso', tone: 'accent' },
  RESET: { label: 'Reinicio', tone: 'neutral' },
};

export function getAreaName(areaId?: AreaId): string {
  return areaId ? AREA_BY_ID[areaId].name : '—';
}

export function getAreaShortName(areaId?: AreaId): string {
  return areaId ? AREA_BY_ID[areaId].shortName : '—';
}

export function getRoleLabel(role: RoleId): string {
  return ROLE_BY_ID[role].label;
}

export function getRoleDisplay(user: { role: RoleId; areaId?: AreaId }): string {
  if (user.role === 'OPERATOR' && user.areaId) {
    return `Operador · ${getAreaShortName(user.areaId)}`;
  }
  return getRoleLabel(user.role);
}
