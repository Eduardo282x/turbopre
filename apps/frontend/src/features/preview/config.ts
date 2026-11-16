import type {
  Area,
  AreaId,
  AssetType,
  AuditAction,
  FieldJobStatus,
  InventoryStatus,
  LoanStatus,
  NonConformitySeverity,
  NonConformityStatus,
  PartStatus,
  PhaseStatus,
  PhaseType,
  Priority,
  ProjectPhase,
  QualityRecordType,
  QualityResult,
  RoleId,
  RouteStatus,
  ServiceMode,
  ServiceOrderStatus,
  ServiceScope,
  SparePartStatus,
  SupplyStatus,
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
  { id: 'assembly', name: 'Izamiento y Ensamble', shortName: 'Ensamble', group: 'production', order: 11, color: '#14b8a6' },
  { id: 'machining_major', name: 'Mecanizado Mayor', shortName: 'Mec. Mayor', group: 'production', order: 12, color: '#2563eb' },
  { id: 'machining_minor', name: 'Mecanizado Menor', shortName: 'Mec. Menor', group: 'production', order: 13, color: '#60a5fa' },
  { id: 'balancing', name: 'Balanceo', shortName: 'Balanceo', group: 'production', order: 14, color: '#8b5cf6' },
  { id: 'special_welding', name: 'Soldaduras Especiales', shortName: 'Soldadura', group: 'production', order: 15, color: '#22c55e' },
  { id: 'generator_shop', name: 'Generadores Eléctricos', shortName: 'Generadores', group: 'production', order: 16, color: '#eab308' },
  { id: 'thermal_coatings', name: 'Tratamiento Térmico y Recubrimientos', shortName: 'Térmico / TBC', group: 'production', order: 17, color: '#f97316' },
  { id: 'metrology', name: 'Metrología y Seguimiento', shortName: 'Metrología', group: 'support', order: 18, color: '#06b6d4' },
  { id: 'material_warehouse', name: 'Almacén de Materiales y Repuestos', shortName: 'Almacén', group: 'support', order: 19, color: '#ef4444' },
  { id: 'admin', name: 'Administración', shortName: 'Administración', group: 'admin', order: 20, color: '#64748b' },
  { id: 'field_gas', name: 'Campo · Turbinas a Gas', shortName: 'Campo Gas', group: 'field', order: 21, color: '#fb923c' },
  { id: 'field_steam', name: 'Campo · Turbinas a Vapor', shortName: 'Campo Vapor', group: 'field', order: 22, color: '#38bdf8' },
  { id: 'field_generator', name: 'Campo · Generadores', shortName: 'Campo Generador', group: 'field', order: 23, color: '#facc15' },
  { id: 'field_engineering', name: 'Campo · Ingeniería y NDT', shortName: 'Campo NDT', group: 'field', order: 24, color: '#a78bfa' },
  { id: 'projects', name: 'Proyectos Electromecánicos', shortName: 'Proyectos', group: 'projects', order: 25, color: '#f472b6' },
  { id: 'supply', name: 'Suministro de Componentes', shortName: 'Suministro', group: 'supply', order: 26, color: '#c084fc' },
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
  { id: 'FIELD', label: 'Supervisor de Campo', description: 'Coordina cuadrillas, permisos y trabajos en sitio.' },
  { id: 'PROJECT', label: 'Gerente de Proyecto', description: 'Gestiona ingeniería, procura, construcción y comisionamiento.' },
  { id: 'NDT', label: 'Inspector NDT', description: 'Ejecuta y libera ensayos no destructivos.' },
  { id: 'METROLOGY', label: 'Metrólogo', description: 'Controla instrumentos, calibraciones y mediciones.' },
  { id: 'HSE', label: 'Seguridad y Ambiente', description: 'Valida permisos, riesgos, EPP y aspectos ambientales.' },
  { id: 'PROCUREMENT', label: 'Procura', description: 'Gestiona compras, proveedores y suministro.' },
  { id: 'SECTION_CHIEF', label: 'Jefe de Sección', description: 'Coordina una sección especializada del taller.' },
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
  FIELD: '#fb923c',
  PROJECT: '#f472b6',
  NDT: '#a78bfa',
  METROLOGY: '#06b6d4',
  HSE: '#ef4444',
  PROCUREMENT: '#c084fc',
  SECTION_CHIEF: '#22c55e',
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

export const SERVICE_MODE_META: Record<ServiceMode, { label: string; shortLabel: string; tone: 'accent' | 'info' | 'warning' | 'success' }> = {
  SHOP: { label: 'Taller', shortLabel: 'Taller', tone: 'accent' },
  FIELD: { label: 'Campo', shortLabel: 'Campo', tone: 'info' },
  PROJECT: { label: 'Proyecto', shortLabel: 'Proyecto', tone: 'warning' },
  SUPPLY: { label: 'Suministro', shortLabel: 'Suministro', tone: 'success' },
};

export const SERVICE_ORDER_STATUS_ORDER: ServiceOrderStatus[] = [
  'RECEIVED',
  'DIAGNOSIS',
  'SCOPING',
  'PLANNING',
  'APPROVED',
  'IN_EXECUTION',
  'IN_QUALITY',
  'READY_FOR_DELIVERY',
  'DELIVERED',
  'CLOSED',
];

export const SERVICE_ORDER_STATUS_META: Record<
  ServiceOrderStatus,
  { label: string; shortLabel: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent' }
> = {
  RECEIVED: { label: 'Recibido', shortLabel: 'Recibido', tone: 'neutral' },
  DIAGNOSIS: { label: 'En diagnóstico', shortLabel: 'Diagnóstico', tone: 'info' },
  SCOPING: { label: 'Definiendo alcance', shortLabel: 'Alcance', tone: 'warning' },
  PLANNING: { label: 'En planificación', shortLabel: 'Planeación', tone: 'warning' },
  APPROVED: { label: 'Aprobado', shortLabel: 'Aprobado', tone: 'info' },
  IN_EXECUTION: { label: 'En ejecución', shortLabel: 'Ejecución', tone: 'accent' },
  IN_QUALITY: { label: 'En calidad', shortLabel: 'Calidad', tone: 'warning' },
  READY_FOR_DELIVERY: { label: 'Listo para entrega', shortLabel: 'Por entregar', tone: 'success' },
  DELIVERED: { label: 'Entregado', shortLabel: 'Entregado', tone: 'success' },
  CLOSED: { label: 'Cerrado', shortLabel: 'Cerrado', tone: 'neutral' },
  CANCELLED: { label: 'Cancelado', shortLabel: 'Cancelado', tone: 'danger' },
};

export const ASSET_TYPE_META: Record<AssetType, { label: string; shortLabel: string }> = {
  GAS_TURBINE: { label: 'Turbina a gas', shortLabel: 'T. Gas' },
  STEAM_TURBINE: { label: 'Turbina a vapor', shortLabel: 'T. Vapor' },
  GENERATOR: { label: 'Generador eléctrico', shortLabel: 'Generador' },
  COMPRESSOR: { label: 'Compresor', shortLabel: 'Compresor' },
  CONTROL_SYSTEM: { label: 'Sistema de control', shortLabel: 'Control' },
  AUXILIARY: { label: 'Equipo auxiliar', shortLabel: 'Auxiliar' },
};

export const SERVICE_SCOPE_META: Record<ServiceScope, { label: string; shortLabel: string }> = {
  COMBUSTION_INSPECTION: { label: 'Inspección de combustión', shortLabel: 'Combustión' },
  HOT_GAS_PATH: { label: 'Inspección de paso de gases calientes', shortLabel: 'Gases calientes' },
  MAJOR_OVERHAUL: { label: 'Mantenimiento mayor', shortLabel: 'Mantenimiento mayor' },
  STEAM_ROTOR_REPAIR: { label: 'Reparación de rotor de vapor', shortLabel: 'Rotor vapor' },
  STEAM_DIAPHRAGM_REPAIR: { label: 'Reparación de diafragma', shortLabel: 'Diafragma' },
  STEAM_CASING_REPAIR: { label: 'Reparación de carcasa', shortLabel: 'Carcasa' },
  GENERATOR_STATOR: { label: 'Mantenimiento de estator', shortLabel: 'Estator' },
  GENERATOR_ROTOR_MINOR: { label: 'Mantenimiento menor de rotor', shortLabel: 'Rotor menor' },
  GENERATOR_ROTOR_MAJOR: { label: 'Mantenimiento mayor de rotor', shortLabel: 'Rotor mayor' },
  GENERATOR_REINSULATION: { label: 'Reaislado de rotor', shortLabel: 'Reaislado' },
  GENERATOR_REWIND: { label: 'Rebobinado de estator', shortLabel: 'Rebobinado' },
  SHOP_MACHINING: { label: 'Mecanizado en taller', shortLabel: 'Mecanizado' },
  SHOP_BALANCING: { label: 'Balanceo dinámico', shortLabel: 'Balanceo' },
  SHOP_WELDING: { label: 'Soldadura especial', shortLabel: 'Soldadura' },
  SHOP_COATING: { label: 'Aplicación de recubrimientos', shortLabel: 'Recubrimientos' },
  SHOP_HEAT_TREATMENT: { label: 'Tratamiento térmico', shortLabel: 'Térmico' },
  SHOP_ASSEMBLY: { label: 'Ensamble y montaje', shortLabel: 'Ensamble' },
  NDT: { label: 'Ensayos no destructivos', shortLabel: 'NDT' },
  CONDITION_MONITORING: { label: 'Monitoreo de condiciones', shortLabel: 'Monitoreo' },
  FIELD_PROJECT: { label: 'Proyecto electromecánico', shortLabel: 'Proyecto' },
  SUPPLY_COMPONENTS: { label: 'Suministro de componentes', shortLabel: 'Componentes' },
  SUPPLY_CONTROL_SYSTEMS: { label: 'Sistemas de control', shortLabel: 'Control' },
};

export const QUALITY_RECORD_TYPE_META: Record<QualityRecordType, { label: string; tone: 'info' | 'warning' | 'success' | 'accent' }> = {
  NDT: { label: 'NDT', tone: 'info' },
  ELECTRICAL: { label: 'Prueba eléctrica', tone: 'accent' },
  DIMENSIONAL: { label: 'Dimensional', tone: 'info' },
  BALANCE: { label: 'Balanceo', tone: 'warning' },
  COATING: { label: 'Recubrimiento', tone: 'warning' },
  HEAT_TREATMENT: { label: 'Tratamiento térmico', tone: 'warning' },
  VISUAL: { label: 'Inspección visual', tone: 'info' },
  FINAL: { label: 'Liberación final', tone: 'success' },
};

export const QUALITY_RESULT_META: Record<QualityResult, { label: string; tone: 'neutral' | 'success' | 'danger' }> = {
  PENDING: { label: 'Pendiente', tone: 'neutral' },
  PASS: { label: 'Aprobado', tone: 'success' },
  FAIL: { label: 'Rechazado', tone: 'danger' },
};

export const NONCONFORMITY_SEVERITY_META: Record<NonConformitySeverity, { label: string; tone: 'info' | 'warning' | 'danger' | 'accent' }> = {
  LOW: { label: 'Baja', tone: 'info' },
  MEDIUM: { label: 'Media', tone: 'warning' },
  HIGH: { label: 'Alta', tone: 'danger' },
  CRITICAL: { label: 'Crítica', tone: 'accent' },
};

export const NONCONFORMITY_STATUS_META: Record<NonConformityStatus, { label: string; tone: 'warning' | 'info' | 'success' }> = {
  OPEN: { label: 'Abierta', tone: 'warning' },
  IN_PROGRESS: { label: 'En tratamiento', tone: 'info' },
  CLOSED: { label: 'Cerrada', tone: 'success' },
};

export const FIELD_STATUS_META: Record<FieldJobStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'accent' }> = {
  PLANNED: { label: 'Planificado', tone: 'warning' },
  MOBILIZED: { label: 'Movilizado', tone: 'info' },
  IN_EXECUTION: { label: 'En ejecución', tone: 'accent' },
  DEMOBILIZED: { label: 'Desmovilizado', tone: 'warning' },
  CLOSED: { label: 'Cerrado', tone: 'success' },
};

export const PROJECT_PHASE_META: Record<ProjectPhase, { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'accent' }> = {
  ENGINEERING: { label: 'Ingeniería', tone: 'info' },
  PROCUREMENT: { label: 'Procura', tone: 'warning' },
  CONSTRUCTION: { label: 'Construcción', tone: 'accent' },
  PRECOMMISSIONING: { label: 'Precomisionamiento', tone: 'warning' },
  COMMISSIONING: { label: 'Comisionamiento', tone: 'success' },
  CLOSED: { label: 'Cerrado', tone: 'neutral' },
};

export const SUPPLY_STATUS_META: Record<SupplyStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'accent' }> = {
  REQUESTED: { label: 'Solicitado', tone: 'warning' },
  QUOTED: { label: 'Cotizado', tone: 'info' },
  PURCHASED: { label: 'Comprado', tone: 'accent' },
  INSPECTION: { label: 'En inspección', tone: 'warning' },
  DISPATCHED: { label: 'Despachado', tone: 'info' },
  DELIVERED: { label: 'Entregado', tone: 'success' },
};

export const CALIBRATION_STATUS_META: Record<'VALID' | 'DUE_SOON' | 'EXPIRED' | 'NONE', { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  VALID: { label: 'Vigente', tone: 'success' },
  DUE_SOON: { label: 'Por vencer', tone: 'warning' },
  EXPIRED: { label: 'Vencida', tone: 'danger' },
  NONE: { label: 'Sin calibración', tone: 'neutral' },
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
