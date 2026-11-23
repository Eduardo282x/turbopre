import type {
  AssetType,
  AuditAction,
  InspectionStatus,
  InventoryStatus,
  LoanStatus,
  Position,
  PositionId,
  Priority,
  Process,
  ProcessId,
  ProjectPhase,
  RoleId,
  RouteStatus,
  ServiceOrderStatus,
  SpareDestination,
  SpareItemStatus,
  TaskStatus,
  User,
} from './types';

export const PROCESSES: Process[] = [
  {
    id: 'rotating',
    name: 'Equipos Rotativos (Turbinas)',
    shortName: 'Rotativos',
    group: 'workshop',
    color: '#f97316',
  },
  {
    id: 'machining',
    name: 'Mecanizado',
    shortName: 'Mecanizado',
    group: 'workshop',
    color: '#3b82f6',
  },
  {
    id: 'generators',
    name: 'Generadores',
    shortName: 'Generadores',
    group: 'workshop',
    color: '#eab308',
  },
  {
    id: 'welding',
    name: 'Soldadura',
    shortName: 'Soldadura',
    group: 'workshop',
    color: '#22c55e',
  },
  {
    id: 'engineering',
    name: 'Ingeniería y Soporte Técnico',
    shortName: 'Ingeniería',
    group: 'engineering',
    color: '#00d1ff',
  },
  {
    id: 'quality',
    name: 'Control de Calidad',
    shortName: 'Calidad',
    group: 'quality',
    color: '#ec4899',
  },
];

export const PROCESS_BY_ID = Object.fromEntries(
  PROCESSES.map((process) => [process.id, process]),
) as Record<ProcessId, Process>;

export const POSITIONS: Position[] = [
  { id: 'rotating_specialist', name: 'Téc. Esp. Equipos Rotativos', shortName: 'Téc. Esp. Rotativos', processId: 'rotating', color: '#f97316' },
  { id: 'rotating_mechanic_1', name: 'Mecánico I (Equipos Rotativos)', shortName: 'Mecánico I', processId: 'rotating', color: '#fb923c' },
  { id: 'rotating_mechanic_2', name: 'Mecánico II (Equipos Rotativos)', shortName: 'Mecánico II', processId: 'rotating', color: '#fdba74' },
  { id: 'lifting_operator', name: 'Operador de Equipos de Izamiento', shortName: 'Izamiento', processId: 'rotating', color: '#ea580c' },
  { id: 'abrasive_operator', name: 'Operador de Limpieza Abrasiva', shortName: 'Limpieza abrasiva', processId: 'generators', color: '#eab308' },
  { id: 'winder_1', name: 'Bobinador I', shortName: 'Bobinador I', processId: 'generators', color: '#facc15' },
  { id: 'winder_2', name: 'Bobinador II', shortName: 'Bobinador II', processId: 'generators', color: '#fde047' },
  { id: 'welder_fi', name: 'Soldador F.I', shortName: 'Soldador F.I', processId: 'welding', color: '#22c55e' },
  { id: 'welder_1', name: 'Soldador I', shortName: 'Soldador I', processId: 'welding', color: '#4ade80' },
  { id: 'welder_2', name: 'Soldador II', shortName: 'Soldador II', processId: 'welding', color: '#86efac' },
  { id: 'machine_operator_1', name: 'Operador de Máquinas y Herramientas I', shortName: 'Máquinas y Herramientas I', processId: 'machining', color: '#3b82f6' },
  { id: 'machine_operator_2', name: 'Operador de Máquinas y Herramientas II', shortName: 'Máquinas y Herramientas II', processId: 'machining', color: '#60a5fa' },
  { id: 'deburrer', name: 'Rebabitador', shortName: 'Rebabitador', processId: 'machining', color: '#93c5fd' },
  { id: 'eng_plans', name: 'Elaboración de Planos', shortName: 'Planos', processId: 'engineering', color: '#00d1ff' },
  { id: 'eng_pmi', name: 'Prueba Positiva de Materiales (PMI)', shortName: 'PMI', processId: 'engineering', color: '#38bdf8' },
  { id: 'eng_sample_cut', name: 'Corte de Muestras', shortName: 'Corte de muestras', processId: 'engineering', color: '#7dd3fc' },
  { id: 'eng_metallography', name: 'Análisis Metalográfico', shortName: 'Metalografía', processId: 'engineering', color: '#bae6fd' },
  { id: 'quality_inspector', name: 'Inspector de Control de Calidad', shortName: 'Inspector de Calidad', processId: 'quality', color: '#ec4899' },
];

export const POSITION_BY_ID = Object.fromEntries(
  POSITIONS.map((position) => [position.id, position]),
) as Record<PositionId, Position>;

export function getPositionsForProcess(processId: ProcessId): Position[] {
  return POSITIONS.filter((position) => position.processId === processId);
}

export function getPositionsForRole(role: RoleId): Position[] {
  if (role === 'OPERATOR') {
    return POSITIONS.filter((position) => ['rotating', 'machining', 'generators', 'welding'].includes(position.processId));
  }
  if (role === 'ENGINEER') {
    return POSITIONS.filter((position) => position.processId === 'engineering');
  }
  if (role === 'QUALITY') {
    return POSITIONS.filter((position) => position.processId === 'quality');
  }
  return [];
}

export const ROLE_OPTIONS: Array<{ id: RoleId; label: string; description: string }> = [
  { id: 'ADMIN', label: 'Administrador / Super usuario', description: 'Ve todo el sistema, administra usuarios y puede intervenir en cualquier flujo.' },
  { id: 'SALES', label: 'Mercadeo y Ventas', description: 'Crea órdenes de servicio, gestiona clientes y confirma entregas.' },
  { id: 'WORKSHOP', label: 'Servicio de Taller', description: 'Recibe la ODS, crea inspecciones, aprueba su alcance y coordina la ejecución.' },
  { id: 'ENGINEER', label: 'Ingeniería y Soporte Técnico', description: 'Crea la hoja de ruta, define tareas por puesto, revisa anexos y ejecuta tareas técnicas.' },
  { id: 'OPERATOR', label: 'Operador de Taller', description: 'Ejecuta las tareas de su puesto dentro de la hoja de ruta.' },
  { id: 'QUALITY', label: 'Calidad', description: 'Ejecuta tareas de inspección y da el visto bueno final de la hoja de ruta.' },
  { id: 'PROJECT_MANAGER', label: 'Gerente de Proyecto', description: 'Aprueba la hoja de ruta antes de liberarla, da seguimiento y ve rendimiento.' },
  { id: 'WAREHOUSE', label: 'Almacén', description: 'Gestiona inventario, solicitudes, préstamos y calibración.' },
];

export const ROLE_BY_ID = Object.fromEntries(
  ROLE_OPTIONS.map((role) => [role.id, role]),
) as Record<RoleId, (typeof ROLE_OPTIONS)[number]>;

export const ROLE_COLORS: Record<RoleId, string> = {
  ADMIN: '#a855f7',
  SALES: '#d946ef',
  WORKSHOP: '#22c55e',
  ENGINEER: '#00d1ff',
  OPERATOR: '#ffb020',
  QUALITY: '#ec4899',
  PROJECT_MANAGER: '#f472b6',
  WAREHOUSE: '#14b8a6',
};

export const ROUTE_STATUS_ORDER: RouteStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'IN_PROGRESS',
  'IN_ANNEXES',
  'IN_QUALITY',
  'READY_FOR_DELIVERY',
  'DELIVERED',
];

type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent';

export const ROUTE_STATUS_META: Record<
  RouteStatus,
  { label: string; shortLabel: string; tone: Tone; description: string }
> = {
  DRAFT: { label: 'Borrador', shortLabel: 'Borrador', tone: 'neutral', description: 'En preparación por Ingeniería.' },
  PENDING_APPROVAL: { label: 'Pendiente de aprobación', shortLabel: 'Por aprobar', tone: 'warning', description: 'Espera la aprobación del Gerente.' },
  APPROVED: { label: 'Aprobada', shortLabel: 'Aprobada', tone: 'info', description: 'Liberada para ejecución en taller.' },
  IN_PROGRESS: { label: 'En ejecución', shortLabel: 'Ejecución', tone: 'accent', description: 'Tareas en curso en los puestos de trabajo.' },
  IN_ANNEXES: { label: 'En anexos', shortLabel: 'Anexos', tone: 'warning', description: 'Ingeniería selecciona las evidencias finales.' },
  IN_QUALITY: { label: 'En calidad', shortLabel: 'Calidad', tone: 'warning', description: 'Pendiente del visto bueno de Calidad.' },
  READY_FOR_DELIVERY: { label: 'Lista para entrega', shortLabel: 'Por entregar', tone: 'success', description: 'Aprobada por Calidad, pendiente de entrega.' },
  DELIVERED: { label: 'Entregada', shortLabel: 'Entregada', tone: 'success', description: 'Entregada al cliente.' },
};

export const INSPECTION_STATUS_META: Record<InspectionStatus, { label: string; tone: Tone }> = {
  OPEN: { label: 'Abierta', tone: 'neutral' },
  IN_PROGRESS: { label: 'En ejecución', tone: 'accent' },
  COMPLETED: { label: 'Completada', tone: 'info' },
  APPROVED: { label: 'Aprobada', tone: 'success' },
  REJECTED: { label: 'Rechazada', tone: 'danger' },
};

export const SERVICE_ORDER_STATUS_META: Record<ServiceOrderStatus, { label: string; tone: Tone }> = {
  RECEIVED: { label: 'Recibida', tone: 'neutral' },
  IN_INSPECTION: { label: 'En inspección', tone: 'info' },
  INSPECTION_APPROVED: { label: 'Inspección aprobada', tone: 'success' },
  IN_ROUTE: { label: 'En hoja de ruta', tone: 'warning' },
  IN_EXECUTION: { label: 'En ejecución', tone: 'accent' },
  IN_ANNEXES: { label: 'En anexos', tone: 'warning' },
  IN_QUALITY: { label: 'En calidad', tone: 'warning' },
  READY_FOR_DELIVERY: { label: 'Lista para entrega', tone: 'success' },
  DELIVERED: { label: 'Entregada', tone: 'success' },
  CANCELLED: { label: 'Cancelada', tone: 'danger' },
};

export const TASK_STATUS_META: Record<TaskStatus, { label: string; tone: Tone }> = {
  BLOCKED: { label: 'Bloqueada', tone: 'neutral' },
  PENDING: { label: 'Pendiente', tone: 'warning' },
  IN_PROGRESS: { label: 'En proceso', tone: 'accent' },
  COMPLETED: { label: 'Completada', tone: 'success' },
};

export const PRIORITY_META: Record<Priority, { label: string; tone: Tone }> = {
  LOW: { label: 'Baja', tone: 'neutral' },
  MEDIUM: { label: 'Media', tone: 'info' },
  HIGH: { label: 'Alta', tone: 'warning' },
  CRITICAL: { label: 'Crítica', tone: 'danger' },
};

export const SPARE_ITEM_STATUS_META: Record<SpareItemStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Pendiente', tone: 'warning' },
  APPROVED: { label: 'Aprobado', tone: 'info' },
  DISPATCHED: { label: 'Despachado', tone: 'success' },
  IN_PROCURE: { label: 'En procura', tone: 'accent' },
  RECEIVED: { label: 'Recibido', tone: 'success' },
};

export const SPARE_DESTINATION_META: Record<SpareDestination, { label: string; tone: Tone }> = {
  WAREHOUSE: { label: 'Almacén', tone: 'info' },
  PROCURE: { label: 'Procura', tone: 'warning' },
};

export const INVENTORY_STATUS_META: Record<InventoryStatus, { label: string; tone: Tone }> = {
  AVAILABLE: { label: 'Disponible', tone: 'success' },
  LOANED: { label: 'Prestado', tone: 'warning' },
  OUT_OF_STOCK: { label: 'Sin stock', tone: 'danger' },
};

export const LOAN_STATUS_META: Record<LoanStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: 'Activo', tone: 'info' },
  RETURNED: { label: 'Devuelto', tone: 'success' },
};

export const ASSET_TYPE_META: Record<AssetType, { label: string; shortLabel: string }> = {
  GAS_TURBINE: { label: 'Turbina a gas', shortLabel: 'T. Gas' },
  STEAM_TURBINE: { label: 'Turbina a vapor', shortLabel: 'T. Vapor' },
  GENERATOR: { label: 'Generador eléctrico', shortLabel: 'Generador' },
  COMPRESSOR: { label: 'Compresor', shortLabel: 'Compresor' },
  AUXILIARY: { label: 'Equipo auxiliar', shortLabel: 'Auxiliar' },
};

export const PROJECT_PHASE_META: Record<ProjectPhase, { label: string; tone: Tone }> = {
  ENGINEERING: { label: 'Ingeniería', tone: 'info' },
  PROCUREMENT: { label: 'Procura', tone: 'warning' },
  CONSTRUCTION: { label: 'Construcción', tone: 'accent' },
  COMMISSIONING: { label: 'Comisionamiento', tone: 'success' },
  CLOSED: { label: 'Cerrado', tone: 'neutral' },
};

export const CALIBRATION_STATUS_META: Record<
  'VALID' | 'DUE_SOON' | 'EXPIRED' | 'NONE',
  { label: string; tone: Tone }
> = {
  VALID: { label: 'Vigente', tone: 'success' },
  DUE_SOON: { label: 'Por vencer', tone: 'warning' },
  EXPIRED: { label: 'Vencida', tone: 'danger' },
  NONE: { label: 'Sin calibración', tone: 'neutral' },
};

export const AUDIT_ACTION_META: Record<AuditAction, { label: string; tone: Tone }> = {
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

export const ALL_ROLES: RoleId[] = ROLE_OPTIONS.map((role) => role.id);

export function getProcessName(processId?: ProcessId): string {
  return processId ? PROCESS_BY_ID[processId].name : '—';
}

export function getProcessShortName(processId?: ProcessId): string {
  return processId ? PROCESS_BY_ID[processId].shortName : '—';
}

export function getPositionName(positionId?: PositionId): string {
  return positionId ? POSITION_BY_ID[positionId].name : '—';
}

export function getPositionShortName(positionId?: PositionId): string {
  return positionId ? POSITION_BY_ID[positionId].shortName : '—';
}

export function getRoleLabel(role: RoleId): string {
  return ROLE_BY_ID[role]?.label ?? role;
}

export function getRoleDisplay(user: Pick<User, 'role' | 'positionId'>): string {
  const position = user.positionId ? POSITION_BY_ID[user.positionId] : undefined;

  if (position) {
    return `${position.shortName} · ${getProcessShortName(position.processId)}`;
  }

  return getRoleLabel(user.role);
}
