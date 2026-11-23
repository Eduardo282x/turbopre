import type {
  Asset,
  AuditEntry,
  Client,
  Inspection,
  InventoryItem,
  Loan,
  PositionId,
  PreviewDatabase,
  ProcessId,
  Project,
  RouteSheet,
  ServiceOrder,
  SpareRequest,
  Task,
  TaskStatus,
  User,
} from '../types';

const NOW = new Date();
export const DEMO_PASSWORD = 'demo1234';

function shiftDays(days: number, hours = 0): string {
  const date = new Date(NOW);
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

const EVIDENCE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#0f1621"/><rect x="24" y="24" width="592" height="312" rx="12" fill="#151d2b" stroke="#263349"/><circle cx="320" cy="148" r="34" fill="none" stroke="#00d1ff" stroke-width="3"/><path d="M296 148l16 16 32-34" fill="none" stroke="#22c55e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><text x="320" y="228" fill="#e6edf7" font-family="sans-serif" font-size="20" text-anchor="middle">Evidencia fotográfica de taller</text><text x="320" y="258" fill="#9aa9c0" font-family="sans-serif" font-size="14" text-anchor="middle">Registro de demostración CAMI</text></svg>',
)}`;

export const USERS: User[] = [
  { id: 'u-admin', name: 'Ana Rivas', username: 'ana.rivas', password: DEMO_PASSWORD, email: 'ana.rivas@turbopre.com', role: 'ADMIN', active: true, createdAt: shiftDays(-420) },
  { id: 'u-sales', name: 'María Pérez', username: 'maria.perez', password: DEMO_PASSWORD, email: 'maria.perez@turbopre.com', role: 'SALES', active: true, createdAt: shiftDays(-380) },
  { id: 'u-sales-2', name: 'Carlos Gutiérrez', username: 'carlos.gutierrez', password: DEMO_PASSWORD, email: 'carlos.gutierrez@turbopre.com', role: 'SALES', active: true, createdAt: shiftDays(-360) },
  { id: 'u-workshop', name: 'Ricardo Bonilla', username: 'ricardo.bonilla', password: DEMO_PASSWORD, email: 'ricardo.bonilla@turbopre.com', role: 'WORKSHOP', active: true, createdAt: shiftDays(-350) },
  { id: 'u-eng-1', name: 'Luis Herrera', username: 'luis.herrera', password: DEMO_PASSWORD, email: 'luis.herrera@turbopre.com', role: 'ENGINEER', positionId: 'eng_plans', active: true, createdAt: shiftDays(-340) },
  { id: 'u-eng-2', name: 'Ariannys Bucobo', username: 'ariannys.bucobo', password: DEMO_PASSWORD, email: 'ariannys.bucobo@turbopre.com', role: 'ENGINEER', positionId: 'eng_pmi', active: true, createdAt: shiftDays(-330) },
  { id: 'u-quality-1', name: 'Valentina Suárez', username: 'valentina.suarez', password: DEMO_PASSWORD, email: 'valentina.suarez@turbopre.com', role: 'QUALITY', positionId: 'quality_inspector', active: true, createdAt: shiftDays(-320) },
  { id: 'u-quality-2', name: 'Héctor Mendoza', username: 'hector.mendoza', password: DEMO_PASSWORD, email: 'hector.mendoza@turbopre.com', role: 'QUALITY', positionId: 'quality_inspector', active: true, createdAt: shiftDays(-310) },
  { id: 'u-project', name: 'Rafael Paredes', username: 'rafael.paredes', password: DEMO_PASSWORD, email: 'rafael.paredes@turbopre.com', role: 'PROJECT_MANAGER', active: true, createdAt: shiftDays(-300) },
  { id: 'u-warehouse-1', name: 'Juan Almacén', username: 'juan.almacen', password: DEMO_PASSWORD, email: 'juan.almacen@turbopre.com', role: 'WAREHOUSE', active: true, createdAt: shiftDays(-290) },
  { id: 'u-warehouse-2', name: 'Marta Almacén', username: 'marta.almacen', password: DEMO_PASSWORD, email: 'marta.almacen@turbopre.com', role: 'WAREHOUSE', active: true, createdAt: shiftDays(-280) },
  { id: 'u-op-rot-1', name: 'Pedro Salas', username: 'pedro.salas', password: DEMO_PASSWORD, email: 'pedro.salas@turbopre.com', role: 'OPERATOR', positionId: 'rotating_specialist', active: true, createdAt: shiftDays(-270) },
  { id: 'u-op-rot-2', name: 'Fernando León', username: 'fernando.leon', password: DEMO_PASSWORD, email: 'fernando.leon@turbopre.com', role: 'OPERATOR', positionId: 'rotating_mechanic_1', active: true, createdAt: shiftDays(-260) },
  { id: 'u-op-mach-1', name: 'Andrés Molina', username: 'andres.molina', password: DEMO_PASSWORD, email: 'andres.molina@turbopre.com', role: 'OPERATOR', positionId: 'machine_operator_1', active: true, createdAt: shiftDays(-250) },
  { id: 'u-op-mach-2', name: 'Daniella Ríos', username: 'daniella.rios', password: DEMO_PASSWORD, email: 'daniella.rios@turbopre.com', role: 'OPERATOR', positionId: 'deburrer', active: true, createdAt: shiftDays(-240) },
  { id: 'u-op-weld-1', name: 'José Gómez', username: 'jose.gomez', password: DEMO_PASSWORD, email: 'jose.gomez@turbopre.com', role: 'OPERATOR', positionId: 'welder_1', active: true, createdAt: shiftDays(-230) },
  { id: 'u-op-weld-2', name: 'Miguel Ortega', username: 'miguel.ortega', password: DEMO_PASSWORD, email: 'miguel.ortega@turbopre.com', role: 'OPERATOR', positionId: 'welder_fi', active: true, createdAt: shiftDays(-220) },
  { id: 'u-op-gen-1', name: 'Jhon Ramírez', username: 'jhon.ramirez', password: DEMO_PASSWORD, email: 'jhon.ramirez@turbopre.com', role: 'OPERATOR', positionId: 'winder_1', active: true, createdAt: shiftDays(-210) },
];

export const CLIENTS: Client[] = [
  { id: 'cli-pastora', name: 'Central Azucarero La Pastora', code: 'CALP', contact: 'Ing. Daniel Marval', email: 'dmarval@lapastora.com', phone: '+58 424 555-0101' },
  { id: 'cli-pdvsa', name: 'PDVSA GOIP', code: 'PGO', contact: 'Ing. Daniel Marval', email: 'dmarval@pdvsa.com', phone: '+58 212 555-0202' },
  { id: 'cli-petropiar', name: 'PetroPiar', code: 'PPI', contact: 'Ing. Rubén Cedeño', email: 'rcedeno@petropiar.com', phone: '+58 285 555-0303' },
  { id: 'cli-cementos', name: 'Cementos Caribe', code: 'CCB', contact: 'Ing. Adriana Pacheco', email: 'apacheco@cementoscaribe.com', phone: '+58 212 555-0404' },
  { id: 'cli-ferrominera', name: 'Ferrominera Orinoco', code: 'FMO', contact: 'Ing. Manuel Rondón', email: 'mrondon@ferrominera.com', phone: '+58 286 555-0505' },
];

export const ASSETS: Asset[] = [
  { id: 'asset-ng-dme500rc', clientId: 'cli-pastora', type: 'STEAM_TURBINE', manufacturer: 'NG', model: 'DME 500RC', serial: 'NG-DME-500RC-118', tag: 'TV-101', location: 'Central Azucarero La Pastora', notes: 'Turbina a vapor de la desfibradora.' },
  { id: 'asset-ng-dme500s', clientId: 'cli-pastora', type: 'STEAM_TURBINE', manufacturer: 'NG', model: 'DME-500S MOL 4', serial: 'NG-DME-500S-M4', tag: 'RT-102', location: 'Central Azucarero La Pastora', notes: 'Rotor de turbina a vapor.' },
  { id: 'asset-elliott-mol5', clientId: 'cli-pastora', type: 'STEAM_TURBINE', manufacturer: 'Elliott', model: 'MOL 5', serial: 'ELL-MOL5-77', tag: 'RT-103', location: 'Central Azucarero La Pastora', notes: 'Rotor de turbina Elliott.' },
  { id: 'asset-comp-c7', clientId: 'cli-pdvsa', type: 'COMPRESSOR', manufacturer: 'General Electric', model: 'Alta C7', serial: 'C7-1855', tag: 'K-201', location: 'Refinería Puerto La Cruz', notes: 'Compresor de alta presión.' },
  { id: 'asset-gen-7fh2', clientId: 'cli-pdvsa', type: 'GENERATOR', manufacturer: 'General Electric', model: '7FH2', serial: '7FH2-4451', tag: 'GEN-701', location: 'Refinería Puerto La Cruz' },
  { id: 'asset-tg-avon', clientId: 'cli-petropiar', type: 'GAS_TURBINE', manufacturer: 'Rolls Royce', model: 'Avon', serial: 'AVON-5510', tag: 'GT-204', location: 'PetroPiar · Jusepín' },
  { id: 'asset-st-300', clientId: 'cli-cementos', type: 'STEAM_TURBINE', manufacturer: 'General Electric', model: 'ST-300', serial: 'ST300-118', tag: 'ST-602', location: 'Cementos Caribe' },
  { id: 'asset-ge-7e', clientId: 'cli-ferrominera', type: 'GAS_TURBINE', manufacturer: 'General Electric', model: '7E', serial: 'GE7E-7721', tag: 'GT-410', location: 'Ferrominera Orinoco' },
];

function taskId(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(2, '0')}`;
}

interface TaskSeed {
  id: string;
  inspectionId?: string;
  routeSheetId?: string;
  source: 'INSPECTION' | 'ROUTE';
  sourceTaskId?: string;
  step: number;
  stage: number;
  processId: ProcessId;
  positionId: PositionId;
  assignedUserId?: string;
  description: string;
  criteria?: string;
  forms?: string;
  status: TaskStatus;
  dayOffset?: number;
  annexSelected?: boolean;
}

function buildTask(seed: TaskSeed): Task {
  const assignee = seed.assignedUserId ?? USERS.find((user) => user.positionId === seed.positionId)?.id;
  const completed = seed.status === 'COMPLETED';
  return {
    id: seed.id,
    inspectionId: seed.inspectionId,
    routeSheetId: seed.routeSheetId,
    source: seed.source,
    sourceTaskId: seed.sourceTaskId,
    step: seed.step,
    stage: seed.stage,
    processId: seed.processId,
    positionId: seed.positionId,
    assignedUserId: assignee,
    description: seed.description,
    criteria: seed.criteria,
    forms: seed.forms,
    status: seed.status,
    evidence: completed ? EVIDENCE : undefined,
    observations: completed ? 'Registro de demostración del proceso.' : undefined,
    startedAt: completed ? shiftDays(seed.dayOffset ?? -1, -4) : undefined,
    completedAt: completed ? shiftDays(seed.dayOffset ?? -1) : undefined,
    completedBy: completed ? assignee : undefined,
    annexSelected: seed.annexSelected,
  };
}

function copyInspectionTasks(
  inspectionTasks: Task[],
  routeId: string,
  annexSelected = false,
): Task[] {
  return inspectionTasks.map((task, index) => ({
    ...task,
    id: `${routeId}-insp-${String(index + 1).padStart(2, '0')}`,
    inspectionId: undefined,
    routeSheetId: routeId,
    source: 'INSPECTION',
    sourceTaskId: task.id,
    status: 'COMPLETED',
    annexSelected,
  }));
}

function buildRouteTasks(
  routeId: string,
  startStep: number,
  seed: Array<Omit<TaskSeed, 'id' | 'routeSheetId' | 'source'> & { step?: number; status: TaskStatus }>,
): Task[] {
  return seed.map((row, index) =>
    buildTask({
      ...row,
      id: `${routeId}-task-${String(index + 1).padStart(2, '0')}`,
      routeSheetId: routeId,
      source: 'ROUTE',
      step: row.step ?? startStep + index * 10,
    }),
  );
}

export function seedDatabase(): PreviewDatabase {
  const serviceOrders: ServiceOrder[] = [
    {
      id: 'so-1915', code: '510000001915', subCode: '520000001658', clientId: 'cli-pastora', assetId: 'asset-ng-dme500rc',
      equipmentCode: 'TV-NG-500RC', description: 'T- DESARME, LIMPIEZA E INSPECCIÓN DE TURBINA A VAPOR MARCA NG MODELO DME 500RC DE LA DESFIBRADORA',
      scope: 'Desarme, limpieza e inspección de turbina a vapor', priority: 'HIGH', dueDate: shiftDays(10), site: 'Central Azucarero La Pastora',
      createdBy: 'u-sales-2', createdAt: shiftDays(-16), updatedAt: shiftDays(-1), inspectionId: 'insp-001', routeSheetId: 'route-001',
    },
    {
      id: 'so-1892', code: '510000001892', subCode: '520000001659', clientId: 'cli-pastora', assetId: 'asset-ng-dme500s',
      equipmentCode: 'RT-NG-500S-M4', description: 'T- LIMPIEZA E INSPECCIÓN DE ROTOR DE TURBINA NG DME-500S MOL 4',
      scope: 'Limpieza e inspección de rotor', priority: 'HIGH', dueDate: shiftDays(14), site: 'Central Azucarero La Pastora',
      createdBy: 'u-sales-2', createdAt: shiftDays(-9), updatedAt: shiftDays(-1), inspectionId: 'insp-002',
    },
    {
      id: 'so-1916', code: '510000001916', subCode: '520000001660', clientId: 'cli-pastora', assetId: 'asset-elliott-mol5',
      equipmentCode: 'RT-ELL-MOL5', description: 'T- LIMPIEZA E INSPECCIÓN DE ROTOR DE TURBINA ELLIOTT MOL5',
      scope: 'Limpieza e inspección de rotor', priority: 'MEDIUM', dueDate: shiftDays(18), site: 'Central Azucarero La Pastora',
      createdBy: 'u-sales-2', createdAt: shiftDays(-4), updatedAt: shiftDays(-1), inspectionId: 'insp-010',
    },
    {
      id: 'so-1855', code: '51-1855', subCode: '52-0001', clientId: 'cli-pdvsa', assetId: 'asset-comp-c7',
      equipmentCode: 'K-201-C7', description: 'REHABILITACION DE COJINETES RADIALES DE COMPRESOR DE ALTA C7',
      scope: 'Rehabilitación de cojinetes radiales', priority: 'CRITICAL', dueDate: shiftDays(5), site: 'Refinería Puerto La Cruz',
      createdBy: 'u-sales', createdAt: shiftDays(-20), updatedAt: shiftDays(-2), inspectionId: 'insp-003', routeSheetId: 'route-002',
    },
    {
      id: 'so-1901', code: '510000001901', subCode: '520000001640', clientId: 'cli-pdvsa', assetId: 'asset-gen-7fh2',
      equipmentCode: 'GEN-701', description: 'MANTENIMIENTO MAYOR DE GENERADOR ELÉCTRICO GE 7FH2',
      scope: 'Mantenimiento mayor de generador', priority: 'HIGH', dueDate: shiftDays(21), site: 'Refinería Puerto La Cruz',
      createdBy: 'u-sales', createdAt: shiftDays(-28), updatedAt: shiftDays(-3), inspectionId: 'insp-004', routeSheetId: 'route-003',
    },
    {
      id: 'so-1888', code: '510000001888', subCode: '520000001630', clientId: 'cli-petropiar', assetId: 'asset-tg-avon',
      equipmentCode: 'GT-204', description: 'INSPECCIÓN DE COMBUSTIÓN EN TURBINA A GAS ROLLS ROYCE AVON',
      scope: 'Inspección de combustión', priority: 'MEDIUM', dueDate: shiftDays(7), site: 'PetroPiar · Jusepín',
      createdBy: 'u-sales', createdAt: shiftDays(-22), updatedAt: shiftDays(-4), inspectionId: 'insp-006', routeSheetId: 'route-004',
    },
    {
      id: 'so-1870', code: '510000001870', subCode: '520000001620', clientId: 'cli-cementos', assetId: 'asset-st-300',
      equipmentCode: 'ST-602', description: 'REPARACIÓN DE ROTOR DE TURBINA A VAPOR GE ST-300',
      scope: 'Reparación de rotor', priority: 'HIGH', dueDate: shiftDays(2), site: 'Cementos Caribe',
      createdBy: 'u-sales-2', createdAt: shiftDays(-30), updatedAt: shiftDays(-5), inspectionId: 'insp-007', routeSheetId: 'route-005',
    },
    {
      id: 'so-1802', code: '510000001802', subCode: '520000001600', clientId: 'cli-ferrominera', assetId: 'asset-ge-7e',
      equipmentCode: 'GT-410', description: 'MANTENIMIENTO MAYOR DE TURBINA A GAS GE 7E',
      scope: 'Mantenimiento mayor', priority: 'MEDIUM', dueDate: shiftDays(-5), site: 'Ferrominera Orinoco',
      createdBy: 'u-sales', createdAt: shiftDays(-60), updatedAt: shiftDays(-8), inspectionId: 'insp-008', routeSheetId: 'route-006',
    },
    {
      id: 'so-1920', code: '510000001920', subCode: '520000001670', clientId: 'cli-pastora', assetId: 'asset-ng-dme500rc',
      equipmentCode: 'TV-NG-500RC-BUJES', description: 'FABRICACIÓN DE BUJES DE BRONCE PARA TURBINA A VAPOR NG DME 500RC',
      scope: 'Fabricación de bujes de bronce', priority: 'LOW', dueDate: shiftDays(30), site: 'Central Azucarero La Pastora',
      createdBy: 'u-sales-2', createdAt: shiftDays(-6), updatedAt: shiftDays(-1), inspectionId: 'insp-009',
    },
    {
      id: 'so-1850', code: '510000001850', subCode: '520000001610', clientId: 'cli-pdvsa', assetId: 'asset-gen-7fh2',
      equipmentCode: 'GEN-701-REBOB', description: 'REBOBINADO DE ESTATOR DEL GENERADOR GE 7FH2',
      scope: 'Rebobinado de estator', priority: 'MEDIUM', dueDate: shiftDays(25), site: 'Refinería Puerto La Cruz',
      createdBy: 'u-sales', createdAt: shiftDays(-12), updatedAt: shiftDays(-1), inspectionId: 'insp-005',
    },
  ];

  const inspections: Inspection[] = [
    {
      id: 'insp-001', code: 'INS-2026-001', serviceOrderId: 'so-1915', status: 'APPROVED',
      findings: 'Se detectó desgaste en la biela y una fisura superficial en el alojamiento. Calidad verificó la limpieza.',
      createdBy: 'u-workshop', createdAt: shiftDays(-14), updatedAt: shiftDays(-11), approvedBy: 'u-workshop', approvedAt: shiftDays(-11),
    },
    {
      id: 'insp-002', code: 'INS-2026-002', serviceOrderId: 'so-1892', status: 'IN_PROGRESS',
      findings: 'Inspección de limpieza y medición de excentricidad en curso.',
      createdBy: 'u-workshop', createdAt: shiftDays(-8), updatedAt: shiftDays(-1),
    },
    {
      id: 'insp-003', code: 'INS-2026-003', serviceOrderId: 'so-1855', status: 'APPROVED',
      findings: 'Babbitt con desgaste uniforme. Se aprueba rehabilitación por rebabitado y mecanizado.',
      createdBy: 'u-workshop', createdAt: shiftDays(-18), updatedAt: shiftDays(-15), approvedBy: 'u-workshop', approvedAt: shiftDays(-15),
    },
    {
      id: 'insp-004', code: 'INS-2026-004', serviceOrderId: 'so-1901', status: 'APPROVED',
      findings: 'Estator con polvo y humedad. Bobinas sin daño visible. Se aprueba limpieza, secado y pruebas.',
      createdBy: 'u-workshop', createdAt: shiftDays(-26), updatedAt: shiftDays(-23), approvedBy: 'u-workshop', approvedAt: shiftDays(-23),
    },
    {
      id: 'insp-005', code: 'INS-2026-005', serviceOrderId: 'so-1850', status: 'REJECTED',
      findings: 'Falta evidencia fotográfica de la limpieza abrasiva.',
      createdBy: 'u-workshop', createdAt: shiftDays(-10), updatedAt: shiftDays(-2), rejectedReason: 'Falta evidencia fotográfica de la limpieza. Repetir inspección.',
    },
    {
      id: 'insp-006', code: 'INS-2026-006', serviceOrderId: 'so-1888', status: 'APPROVED',
      findings: 'Cámaras de combustión con desgaste leve. Se aprueba limpieza y verificación dimensional.',
      createdBy: 'u-workshop', createdAt: shiftDays(-20), updatedAt: shiftDays(-17), approvedBy: 'u-workshop', approvedAt: shiftDays(-17),
    },
    {
      id: 'insp-007', code: 'INS-2026-007', serviceOrderId: 'so-1870', status: 'APPROVED',
      findings: 'Rotor con desgaste en sellos. Se aprueba recuperación y balanceo.',
      createdBy: 'u-workshop', createdAt: shiftDays(-28), updatedAt: shiftDays(-25), approvedBy: 'u-workshop', approvedAt: shiftDays(-25),
    },
    {
      id: 'insp-008', code: 'INS-2026-008', serviceOrderId: 'so-1802', status: 'APPROVED',
      findings: 'Inspección de paso de gases calientes completada. Sin hallazgos críticos.',
      createdBy: 'u-workshop', createdAt: shiftDays(-58), updatedAt: shiftDays(-55), approvedBy: 'u-workshop', approvedAt: shiftDays(-55),
    },
    {
      id: 'insp-009', code: 'INS-2026-009', serviceOrderId: 'so-1920', status: 'APPROVED',
      findings: 'Bujes con desgaste dimensional. Se aprueba fabricación de reemplazo.',
      createdBy: 'u-workshop', createdAt: shiftDays(-5), updatedAt: shiftDays(-3), approvedBy: 'u-workshop', approvedAt: shiftDays(-3),
    },
    {
      id: 'insp-010', code: 'INS-2026-010', serviceOrderId: 'so-1916', status: 'COMPLETED',
      findings: 'Limpieza e inspección del rotor Elliott completadas. Se detectó desgaste leve en sellos. Pendiente aprobación de Taller.',
      createdBy: 'u-workshop', createdAt: shiftDays(-3), updatedAt: shiftDays(-1),
    },
  ];

  const routeSheets: RouteSheet[] = [
    {
      id: 'route-001', code: 'HR-2026-001', serviceOrderId: 'so-1915', inspectionId: 'insp-001',
      description: 'REHABILITACIÓN DE TURBINA A VAPOR NG DME 500RC DE LA DESFIBRADORA',
      serial: 'NG-DME-500RC-118', equipmentCode: 'TV-NG-500RC', site: 'Central Azucarero La Pastora',
      scope: 'Desarme, limpieza, inspección y reparación de biela', priority: 'HIGH', dueDate: shiftDays(10),
      status: 'IN_PROGRESS', createdBy: 'u-eng-1', createdAt: shiftDays(-11), updatedAt: shiftDays(-1),
      preparedBy: 'u-eng-1', preparedAt: shiftDays(-10), approvedBy: 'u-project', approvedAt: shiftDays(-8),
      observations: 'Se debe registrar evidencia fotográfica de cada paso.',
    },
    {
      id: 'route-002', code: 'HR-2026-002', serviceOrderId: 'so-1855', inspectionId: 'insp-003',
      description: 'REHABILITACION DE COJINETES RADIALES DE COMPRESOR DE ALTA C7',
      serial: 'C7-1855', equipmentCode: 'K-201-C7', site: 'Refinería Puerto La Cruz',
      scope: 'Remoción de Babbitt, rebabitado, mecanizado, END y verificación final', priority: 'CRITICAL', dueDate: shiftDays(5),
      status: 'PENDING_APPROVAL', createdBy: 'u-eng-2', createdAt: shiftDays(-4), updatedAt: shiftDays(-2),
      preparedBy: 'u-eng-2', preparedAt: shiftDays(-2),
      observations: 'Hoja basada en el procedimiento PR-TUR-100 y el formato real de hoja de ruta.',
    },
    {
      id: 'route-003', code: 'HR-2026-003', serviceOrderId: 'so-1901', inspectionId: 'insp-004',
      description: 'MANTENIMIENTO MAYOR DE GENERADOR ELÉCTRICO GE 7FH2',
      serial: '7FH2-4451', equipmentCode: 'GEN-701', site: 'Refinería Puerto La Cruz',
      scope: 'Limpieza, revisión de bobinas, pruebas eléctricas y cierre', priority: 'HIGH', dueDate: shiftDays(21),
      status: 'IN_ANNEXES', createdBy: 'u-eng-1', createdAt: shiftDays(-22), updatedAt: shiftDays(-1),
      preparedBy: 'u-eng-1', preparedAt: shiftDays(-21), approvedBy: 'u-project', approvedAt: shiftDays(-19),
      observations: 'Todas las tareas completadas. Pendiente selección de anexos por Ingeniería.',
    },
    {
      id: 'route-004', code: 'HR-2026-004', serviceOrderId: 'so-1888', inspectionId: 'insp-006',
      description: 'INSPECCIÓN DE COMBUSTIÓN EN TURBINA A GAS ROLLS ROYCE AVON',
      serial: 'AVON-5510', equipmentCode: 'GT-204', site: 'PetroPiar · Jusepín',
      scope: 'Inspección de combustión y verificación dimensional', priority: 'MEDIUM', dueDate: shiftDays(7),
      status: 'IN_QUALITY', createdBy: 'u-eng-1', createdAt: shiftDays(-16), updatedAt: shiftDays(-1),
      preparedBy: 'u-eng-1', preparedAt: shiftDays(-15), approvedBy: 'u-project', approvedAt: shiftDays(-13),
      annexFinalizedBy: 'u-eng-1', annexFinalizedAt: shiftDays(-1),
      observations: 'Anexos seleccionados. Pendiente visto bueno de Calidad.',
    },
    {
      id: 'route-005', code: 'HR-2026-005', serviceOrderId: 'so-1870', inspectionId: 'insp-007',
      description: 'REPARACIÓN DE ROTOR DE TURBINA A VAPOR GE ST-300',
      serial: 'ST300-118', equipmentCode: 'ST-602', site: 'Cementos Caribe',
      scope: 'Recuperación de sellos, mecanizado y balanceo', priority: 'HIGH', dueDate: shiftDays(2),
      status: 'READY_FOR_DELIVERY', createdBy: 'u-eng-2', createdAt: shiftDays(-24), updatedAt: shiftDays(-1),
      preparedBy: 'u-eng-2', preparedAt: shiftDays(-23), approvedBy: 'u-project', approvedAt: shiftDays(-21),
      annexFinalizedBy: 'u-eng-2', annexFinalizedAt: shiftDays(-3), qualityApprovedBy: 'u-quality-1', qualityApprovedAt: shiftDays(-1),
      observations: 'Calidad aprobó la hoja. Pendiente confirmación de entrega por Ventas.',
    },
    {
      id: 'route-006', code: 'HR-2026-006', serviceOrderId: 'so-1802', inspectionId: 'insp-008',
      description: 'MANTENIMIENTO MAYOR DE TURBINA A GAS GE 7E',
      serial: 'GE7E-7721', equipmentCode: 'GT-410', site: 'Ferrominera Orinoco',
      scope: 'Mantenimiento mayor de componentes de combustión', priority: 'MEDIUM', dueDate: shiftDays(-5),
      status: 'DELIVERED', createdBy: 'u-eng-1', createdAt: shiftDays(-54), updatedAt: shiftDays(-9),
      preparedBy: 'u-eng-1', preparedAt: shiftDays(-53), approvedBy: 'u-project', approvedAt: shiftDays(-51),
      annexFinalizedBy: 'u-eng-1', annexFinalizedAt: shiftDays(-12), qualityApprovedBy: 'u-quality-2', qualityApprovedAt: shiftDays(-10),
      deliveredAt: shiftDays(-9), observations: 'Expediente entregado y archivado.',
    },
  ];

  const tasks: Task[] = [];

  // Inspection 001: rotor de turbina La Pastora.
  tasks.push(
    buildTask({ id: taskId('insp-001', 1), inspectionId: 'insp-001', source: 'INSPECTION', step: 10, stage: 1, processId: 'rotating', positionId: 'rotating_specialist', assignedUserId: 'u-op-rot-1', description: 'Inspección visual y dimensional de la turbina a vapor.', criteria: 'PR-TUR-100', forms: 'FO-ING-110', status: 'COMPLETED', dayOffset: -13 }),
    buildTask({ id: taskId('insp-001', 2), inspectionId: 'insp-001', source: 'INSPECTION', step: 20, stage: 1, processId: 'rotating', positionId: 'rotating_mechanic_1', assignedUserId: 'u-op-rot-2', description: 'Revisar fisura de la biela y registrar hallazgos.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'COMPLETED', dayOffset: -13 }),
    buildTask({ id: taskId('insp-001', 3), inspectionId: 'insp-001', source: 'INSPECTION', step: 30, stage: 1, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Realizar inspección de limpieza de la turbina.', criteria: 'PR-CAL-109', forms: 'FO-ING-155', status: 'COMPLETED', dayOffset: -12 }),
    buildTask({ id: taskId('insp-001', 4), inspectionId: 'insp-001', source: 'INSPECTION', step: 40, stage: 2, processId: 'rotating', positionId: 'rotating_mechanic_2', assignedUserId: 'u-op-rot-2', description: 'Medir holguras del rotor y comparar con tolerancias.', criteria: 'PR-TUR-100', forms: 'FO-ING-111', status: 'COMPLETED', dayOffset: -12 }),
    buildTask({ id: taskId('insp-001', 5), inspectionId: 'insp-001', source: 'INSPECTION', step: 50, stage: 2, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Verificar mediciones y registrar evidencia fotográfica.', criteria: 'IN-CAL-132', forms: 'FO-ING-157', status: 'COMPLETED', dayOffset: -11 }),
  );

  // Inspection 002: rotor NG DME-500S.
  tasks.push(
    buildTask({ id: taskId('insp-002', 1), inspectionId: 'insp-002', source: 'INSPECTION', step: 10, stage: 1, processId: 'rotating', positionId: 'rotating_specialist', assignedUserId: 'u-op-rot-1', description: 'Inspección visual del rotor NG DME-500S MOL 4.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'PENDING' }),
    buildTask({ id: taskId('insp-002', 2), inspectionId: 'insp-002', source: 'INSPECTION', step: 20, stage: 1, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Inspección de limpieza del rotor y registro fotográfico.', criteria: 'PR-CAL-109', forms: 'FO-ING-155', status: 'PENDING' }),
    buildTask({ id: taskId('insp-002', 3), inspectionId: 'insp-002', source: 'INSPECTION', step: 30, stage: 2, processId: 'rotating', positionId: 'rotating_mechanic_1', assignedUserId: 'u-op-rot-2', description: 'Medir excentricidad y desgaste de sellos.', criteria: 'PR-TUR-100', forms: 'FO-ING-111', status: 'BLOCKED' }),
  );

  // Inspection 003: cojinetes radiales compresor C7.
  tasks.push(
    buildTask({ id: taskId('insp-003', 1), inspectionId: 'insp-003', source: 'INSPECTION', step: 10, stage: 1, processId: 'machining', positionId: 'deburrer', assignedUserId: 'u-op-mach-2', description: 'Efectuar remoción del Babbitt a través de mecanizado o llama oxiacetilénica.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'COMPLETED', dayOffset: -17 }),
    buildTask({ id: taskId('insp-003', 2), inspectionId: 'insp-003', source: 'INSPECTION', step: 20, stage: 1, processId: 'machining', positionId: 'machine_operator_1', assignedUserId: 'u-op-mach-1', description: 'Desbastar, mecanizar y biselar el material base.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'COMPLETED', dayOffset: -17 }),
    buildTask({ id: taskId('insp-003', 3), inspectionId: 'insp-003', source: 'INSPECTION', step: 30, stage: 1, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Realizar END con tintes penetrantes coloreados.', criteria: 'IN-CAL-102', forms: 'FO-ING-110', status: 'COMPLETED', dayOffset: -16 }),
    buildTask({ id: taskId('insp-003', 4), inspectionId: 'insp-003', source: 'INSPECTION', step: 40, stage: 2, processId: 'machining', positionId: 'deburrer', assignedUserId: 'u-op-mach-2', description: 'Validación de proceso y rebabitado.', criteria: 'PR-TUR-100', forms: 'FO-ING-186', status: 'COMPLETED', dayOffset: -16 }),
  );

  // Inspection 004: generador GE 7FH2.
  tasks.push(
    buildTask({ id: taskId('insp-004', 1), inspectionId: 'insp-004', source: 'INSPECTION', step: 10, stage: 1, processId: 'generators', positionId: 'abrasive_operator', assignedUserId: 'u-op-gen-1', description: 'Limpieza abrasiva y secado del estator.', criteria: 'PR-GEN-100', forms: 'N/A', status: 'COMPLETED', dayOffset: -25 }),
    buildTask({ id: taskId('insp-004', 2), inspectionId: 'insp-004', source: 'INSPECTION', step: 20, stage: 1, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-2', description: 'Inspección visual de limpieza y registro fotográfico.', criteria: 'PR-CAL-109', forms: 'FO-ING-155', status: 'COMPLETED', dayOffset: -24 }),
    buildTask({ id: taskId('insp-004', 3), inspectionId: 'insp-004', source: 'INSPECTION', step: 30, stage: 2, processId: 'generators', positionId: 'winder_1', assignedUserId: 'u-op-gen-1', description: 'Revisión de bobinas y cuñas del estator.', criteria: 'PR-GEN-110', forms: 'FO-ING-170', status: 'COMPLETED', dayOffset: -24 }),
    buildTask({ id: taskId('insp-004', 4), inspectionId: 'insp-004', source: 'INSPECTION', step: 40, stage: 2, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-2', description: 'Prueba de resistencia de aislamiento inicial.', criteria: 'IN-CAL-115', forms: 'FO-ING-111', status: 'COMPLETED', dayOffset: -23 }),
  );

  // Inspection 005: rebobinado rechazado.
  tasks.push(
    buildTask({ id: taskId('insp-005', 1), inspectionId: 'insp-005', source: 'INSPECTION', step: 10, stage: 1, processId: 'generators', positionId: 'abrasive_operator', assignedUserId: 'u-op-gen-1', description: 'Limpieza abrasiva del estator y registro fotográfico.', criteria: 'PR-GEN-100', forms: 'N/A', status: 'PENDING' }),
    buildTask({ id: taskId('insp-005', 2), inspectionId: 'insp-005', source: 'INSPECTION', step: 20, stage: 1, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Inspección visual de limpieza.', criteria: 'PR-CAL-109', forms: 'FO-ING-155', status: 'PENDING' }),
  );

  // Inspection 006: combustión Rolls Royce Avon.
  tasks.push(
    buildTask({ id: taskId('insp-006', 1), inspectionId: 'insp-006', source: 'INSPECTION', step: 10, stage: 1, processId: 'rotating', positionId: 'rotating_specialist', assignedUserId: 'u-op-rot-1', description: 'Inspección de combustión y cámaras con videoscopia.', criteria: 'PR-TUR-110', forms: 'FO-ING-120', status: 'COMPLETED', dayOffset: -19 }),
    buildTask({ id: taskId('insp-006', 2), inspectionId: 'insp-006', source: 'INSPECTION', step: 20, stage: 1, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Inspección visual y verificación dimensional de componentes.', criteria: 'PR-CAL-109', forms: 'FO-ING-155', status: 'COMPLETED', dayOffset: -18 }),
  );

  // Inspection 007: rotor GE ST-300.
  tasks.push(
    buildTask({ id: taskId('insp-007', 1), inspectionId: 'insp-007', source: 'INSPECTION', step: 10, stage: 1, processId: 'rotating', positionId: 'rotating_specialist', assignedUserId: 'u-op-rot-1', description: 'Inspección de sellos y álabes del rotor.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'COMPLETED', dayOffset: -27 }),
    buildTask({ id: taskId('insp-007', 2), inspectionId: 'insp-007', source: 'INSPECTION', step: 20, stage: 1, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Registro fotográfico y verificación de limpieza.', criteria: 'PR-CAL-109', forms: 'FO-ING-155', status: 'COMPLETED', dayOffset: -26 }),
  );

  // Inspection 008: turbina GE 7E.
  tasks.push(
    buildTask({ id: taskId('insp-008', 1), inspectionId: 'insp-008', source: 'INSPECTION', step: 10, stage: 1, processId: 'rotating', positionId: 'rotating_specialist', assignedUserId: 'u-op-rot-1', description: 'Inspección de paso de gases calientes.', criteria: 'PR-TUR-110', forms: 'FO-ING-120', status: 'COMPLETED', dayOffset: -57 }),
    buildTask({ id: taskId('insp-008', 2), inspectionId: 'insp-008', source: 'INSPECTION', step: 20, stage: 1, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-2', description: 'Inspección visual y registro de hallazgos.', criteria: 'PR-CAL-109', forms: 'FO-ING-155', status: 'COMPLETED', dayOffset: -56 }),
  );

  // Inspection 009: bujes de bronce aprobada, sin hoja de ruta.
  tasks.push(
    buildTask({ id: taskId('insp-009', 1), inspectionId: 'insp-009', source: 'INSPECTION', step: 10, stage: 1, processId: 'machining', positionId: 'machine_operator_1', assignedUserId: 'u-op-mach-1', description: 'Inspección dimensional de bujes de bronce.', criteria: 'PR-MEC-100', forms: 'FO-ING-157', status: 'COMPLETED', dayOffset: -4 }),
    buildTask({ id: taskId('insp-009', 2), inspectionId: 'insp-009', source: 'INSPECTION', step: 20, stage: 1, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Inspección visual y verificación de limpieza.', criteria: 'PR-CAL-109', forms: 'FO-ING-155', status: 'COMPLETED', dayOffset: -3 }),
  );

  // Inspection 010: rotor Elliott completado, pendiente de aprobación de Taller.
  tasks.push(
    buildTask({ id: taskId('insp-010', 1), inspectionId: 'insp-010', source: 'INSPECTION', step: 10, stage: 1, processId: 'rotating', positionId: 'rotating_specialist', assignedUserId: 'u-op-rot-1', description: 'Inspección visual del rotor Elliott MOL5.', criteria: 'PR-TUR-100', forms: 'FO-ING-110', status: 'COMPLETED', dayOffset: -2 }),
    buildTask({ id: taskId('insp-010', 2), inspectionId: 'insp-010', source: 'INSPECTION', step: 20, stage: 1, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Inspección de limpieza y registro fotográfico del rotor.', criteria: 'PR-CAL-109', forms: 'FO-ING-155', status: 'COMPLETED', dayOffset: -2 }),
    buildTask({ id: taskId('insp-010', 3), inspectionId: 'insp-010', source: 'INSPECTION', step: 30, stage: 2, processId: 'rotating', positionId: 'rotating_mechanic_1', assignedUserId: 'u-op-rot-2', description: 'Medir desgaste de sellos y holguras del rotor.', criteria: 'PR-TUR-100', forms: 'FO-ING-111', status: 'COMPLETED', dayOffset: -1 }),
  );

  // Route 001: copia la inspección 001 y agrega tareas de ingeniería, mecanizado, soldadura y calidad.
  const insp001Tasks = tasks.filter((task) => task.inspectionId === 'insp-001');
  tasks.push(...copyInspectionTasks(insp001Tasks, 'route-001', true));
  tasks.push(
    ...buildRouteTasks('route-001', 60, [
      { step: 60, stage: 3, processId: 'engineering', positionId: 'eng_plans', assignedUserId: 'u-eng-1', description: 'Elaborar plano de reparación de biela y alojamiento.', criteria: 'PR-ING-100', forms: 'FO-ING-120', status: 'COMPLETED', dayOffset: -7 },
      { step: 70, stage: 3, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Revisar y aprobar plano de reparación.', criteria: 'PR-CAL-109', forms: 'FO-ING-155', status: 'COMPLETED', dayOffset: -6 },
      { step: 80, stage: 4, processId: 'machining', positionId: 'machine_operator_1', assignedUserId: 'u-op-mach-1', description: 'Mecanizar superficie de biela según plano aprobado.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'COMPLETED', dayOffset: -5 },
      { step: 90, stage: 4, processId: 'welding', positionId: 'welder_1', assignedUserId: 'u-op-weld-1', description: 'Reparar fisura por soldadura GTAW y verificar penetración.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'PENDING' },
      { step: 100, stage: 4, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Realizar END con tintes penetrantes a la soldadura.', criteria: 'IN-CAL-102', forms: 'FO-ING-110', status: 'PENDING' },
      { step: 105, stage: 4, processId: 'engineering', positionId: 'eng_plans', assignedUserId: 'u-eng-1', description: 'Revisar y firmar plano final de reparación.', criteria: 'PR-ING-101', forms: 'FO-ING-121', status: 'PENDING' },
      { step: 110, stage: 5, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Liberación final de calidad y verificación para despacho.', criteria: 'PR-CAL-109', forms: 'FO-ING-184', status: 'BLOCKED' },
    ]),
  );

  // Route 002: hoja de cojinetes C7 basada en el formato real.
  const insp003Tasks = tasks.filter((task) => task.inspectionId === 'insp-003');
  tasks.push(...copyInspectionTasks(insp003Tasks, 'route-002', false));
  tasks.push(
    ...buildRouteTasks('route-002', 50, [
      { step: 50, stage: 3, processId: 'machining', positionId: 'deburrer', assignedUserId: 'u-op-mach-2', description: 'Efectuar la aplicación de estaño.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'BLOCKED' },
      { step: 60, stage: 3, processId: 'machining', positionId: 'deburrer', assignedUserId: 'u-op-mach-2', description: 'Efectuar precalentamiento sobre el material base.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'BLOCKED' },
      { step: 70, stage: 3, processId: 'machining', positionId: 'deburrer', assignedUserId: 'u-op-mach-2', description: 'Aplicar Babbitt de forma homogénea sobre el material base.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'BLOCKED' },
      { step: 80, stage: 3, processId: 'machining', positionId: 'machine_operator_1', assignedUserId: 'u-op-mach-1', description: 'Mecanizar de forma manual el remanente de material de Babbitt.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'BLOCKED' },
      { step: 90, stage: 3, processId: 'machining', positionId: 'machine_operator_1', assignedUserId: 'u-op-mach-1', description: 'Pre-mecanizar hasta alcanzar una superficie uniforme.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'BLOCKED' },
      { step: 100, stage: 3, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Realizar prueba de ultrasonido (proceso).', criteria: 'IN-CAL-115', forms: 'FO-ING-111', status: 'BLOCKED' },
      { step: 110, stage: 3, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Realizar END con tintes penetrantes coloreados (proceso).', criteria: 'IN-CAL-102', forms: 'FO-ING-110', status: 'BLOCKED' },
      { step: 120, stage: 3, processId: 'machining', positionId: 'machine_operator_1', assignedUserId: 'u-op-mach-1', description: 'Mecanizar hasta dimensiones finales requeridas.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'BLOCKED' },
      { step: 130, stage: 3, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Realizar inspección dimensional final.', criteria: 'IN-CAL-132', forms: 'FO-ING-157', status: 'BLOCKED' },
      { step: 140, stage: 3, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Realizar prueba de ultrasonido final.', criteria: 'IN-CAL-115', forms: 'FO-ING-111', status: 'BLOCKED' },
      { step: 150, stage: 3, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Realizar END con tintes penetrantes final.', criteria: 'IN-CAL-102', forms: 'FO-ING-110', status: 'BLOCKED' },
      { step: 160, stage: 3, processId: 'rotating', positionId: 'rotating_specialist', assignedUserId: 'u-op-rot-1', description: 'Instalar RTD (4 por cojinete).', criteria: 'N/A', forms: 'N/A', status: 'BLOCKED' },
      { step: 170, stage: 3, processId: 'rotating', positionId: 'rotating_specialist', assignedUserId: 'u-op-rot-1', description: 'Efectuar prueba de la instrumentación RTD instalada.', criteria: 'IN-GEN-117', forms: 'FO-INST-111', status: 'BLOCKED' },
      { step: 180, stage: 3, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Realizar inspección visual final y registro fotográfico.', criteria: 'PR-CAL-109', forms: 'FO-ING-155', status: 'BLOCKED' },
      { step: 190, stage: 3, processId: 'machining', positionId: 'deburrer', assignedUserId: 'u-op-mach-2', description: 'Aplicar pintura y protector anticorrosivo al componente.', criteria: 'PR-TUR-100', forms: 'N/A', status: 'BLOCKED' },
      { step: 200, stage: 3, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Realizar verificación para despacho.', criteria: 'N/A', forms: 'FO-ING-184', status: 'BLOCKED' },
    ]),
  );

  // Route 003: generador, todo completado, en anexos.
  const insp004Tasks = tasks.filter((task) => task.inspectionId === 'insp-004');
  tasks.push(...copyInspectionTasks(insp004Tasks, 'route-003', true));
  tasks.push(
    ...buildRouteTasks('route-003', 50, [
      { step: 50, stage: 3, processId: 'generators', positionId: 'winder_2', assignedUserId: 'u-op-gen-1', description: 'Instalar bobinas y cuñas del estator.', criteria: 'PR-GEN-120', forms: 'FO-ING-172', status: 'COMPLETED', dayOffset: -8, annexSelected: true },
      { step: 60, stage: 3, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-2', description: 'Prueba de resistencia de aislamiento final.', criteria: 'IN-CAL-115', forms: 'FO-ING-111', status: 'COMPLETED', dayOffset: -6, annexSelected: true },
      { step: 70, stage: 4, processId: 'engineering', positionId: 'eng_plans', assignedUserId: 'u-eng-1', description: 'Elaborar informe de cierre y memoria técnica.', criteria: 'PR-ING-110', forms: 'FO-ING-130', status: 'COMPLETED', dayOffset: -3, annexSelected: false },
      { step: 80, stage: 4, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-2', description: 'Revisión final de evidencias y anexos.', criteria: 'PR-CAL-109', forms: 'FO-ING-155', status: 'COMPLETED', dayOffset: -2, annexSelected: true },
    ]),
  );

  // Route 004: combustión, en calidad.
  const insp006Tasks = tasks.filter((task) => task.inspectionId === 'insp-006');
  tasks.push(...copyInspectionTasks(insp006Tasks, 'route-004', true));
  tasks.push(
    ...buildRouteTasks('route-004', 30, [
      { step: 30, stage: 2, processId: 'rotating', positionId: 'rotating_mechanic_1', assignedUserId: 'u-op-rot-2', description: 'Limpieza y verificación de cámaras de combustión.', criteria: 'PR-TUR-110', forms: 'FO-ING-120', status: 'COMPLETED', dayOffset: -8, annexSelected: true },
      { step: 40, stage: 2, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-1', description: 'Verificación dimensional y liberación de componentes.', criteria: 'IN-CAL-132', forms: 'FO-ING-157', status: 'COMPLETED', dayOffset: -5, annexSelected: true },
    ]),
  );

  // Route 005: rotor ST-300, lista para entrega.
  const insp007Tasks = tasks.filter((task) => task.inspectionId === 'insp-007');
  tasks.push(...copyInspectionTasks(insp007Tasks, 'route-005', true));
  tasks.push(
    ...buildRouteTasks('route-005', 30, [
      { step: 30, stage: 2, processId: 'machining', positionId: 'machine_operator_2', assignedUserId: 'u-op-mach-1', description: 'Recuperar sellos y mecanizar superficies de apoyo.', criteria: 'PR-MEC-100', forms: 'FO-ING-157', status: 'COMPLETED', dayOffset: -12, annexSelected: true },
      { step: 40, stage: 2, processId: 'rotating', positionId: 'rotating_specialist', assignedUserId: 'u-op-rot-1', description: 'Balanceo dinámico del rotor y verificación final.', criteria: 'IN-CAL-120', forms: 'FO-ING-160', status: 'COMPLETED', dayOffset: -8, annexSelected: true },
    ]),
  );

  // Route 006: turbina GE 7E, entregada.
  const insp008Tasks = tasks.filter((task) => task.inspectionId === 'insp-008');
  tasks.push(...copyInspectionTasks(insp008Tasks, 'route-006', true));
  tasks.push(
    ...buildRouteTasks('route-006', 30, [
      { step: 30, stage: 2, processId: 'welding', positionId: 'welder_fi', assignedUserId: 'u-op-weld-2', description: 'Reparación de componentes de combustión por soldadura especial.', criteria: 'PR-SOL-100', forms: 'FO-ING-140', status: 'COMPLETED', dayOffset: -25, annexSelected: true },
      { step: 40, stage: 2, processId: 'quality', positionId: 'quality_inspector', assignedUserId: 'u-quality-2', description: 'Inspección final y liberación de componentes.', criteria: 'PR-CAL-109', forms: 'FO-ING-155', status: 'COMPLETED', dayOffset: -20, annexSelected: true },
    ]),
  );

  const spareRequests: SpareRequest[] = [
    {
      id: 'spare-001', code: 'REP-2026-001', routeSheetId: 'route-001', requestedBy: 'u-workshop', requestedAt: shiftDays(-3),
      notes: 'Materiales para la reparación de biela y alojamiento.',
      items: [
        { id: 'spare-001-1', name: 'Rodamiento SKF 6205', code: 'RD-1001', quantity: 2, destination: 'WAREHOUSE', status: 'DISPATCHED', available: true },
        { id: 'spare-001-2', name: 'Sello mecánico 2"', code: 'SM-2024', quantity: 1, destination: 'WAREHOUSE', status: 'APPROVED', available: true },
        { id: 'spare-001-3', name: 'Electrodo E7018', code: 'EL-7018', quantity: 5, destination: 'WAREHOUSE', status: 'PENDING', available: true },
        { id: 'spare-001-4', name: 'Varilla Babbitt 1/8"', code: 'VB-018', quantity: 3, destination: 'PROCURE', status: 'IN_PROCURE', available: false },
      ],
    },
    {
      id: 'spare-002', code: 'REP-2026-002', routeSheetId: 'route-002', requestedBy: 'u-eng-2', requestedAt: shiftDays(-1),
      notes: 'Consumibles para rebabitado.',
      items: [
        { id: 'spare-002-1', name: 'Varilla Babbitt 3/16"', code: 'VB-316', quantity: 2, destination: 'PROCURE', status: 'IN_PROCURE', available: false },
        { id: 'spare-002-2', name: 'Tungsteno 2% Torio', code: 'TG-2T', quantity: 1, destination: 'PROCURE', status: 'PENDING', available: false },
      ],
    },
  ];

  const inventory: InventoryItem[] = [
    { id: 'inv-1', name: 'Rodamiento SKF 6205', code: 'RD-1001', category: 'Mecánica', quantity: 10, status: 'AVAILABLE', location: 'Estante A-1', qrCode: 'QR-RD-1001', certificate: 'CERT-MAT-001', controlledAtmosphere: true },
    { id: 'inv-2', name: 'Sello mecánico 2"', code: 'SM-2024', category: 'Hidráulica', quantity: 3, status: 'AVAILABLE', location: 'Estante B-2', qrCode: 'QR-SM-2024', certificate: 'CERT-MAT-002' },
    { id: 'inv-3', name: 'Electrodo E7018', code: 'EL-7018', category: 'Soldadura', quantity: 33, status: 'AVAILABLE', location: 'Estante E-2', qrCode: 'QR-EL-7018', certificate: 'CERT-CONS-018', controlledAtmosphere: true },
    { id: 'inv-4', name: 'Varilla Babbitt 1/8"', code: 'VB-018', category: 'Soldadura', quantity: 0, status: 'OUT_OF_STOCK', location: 'Estante E-3', qrCode: 'QR-VB-018' },
    { id: 'inv-5', name: 'Aceite hidráulico ISO 68', code: 'AH-0068', category: 'Lubricantes', quantity: 9, status: 'AVAILABLE', location: 'Estante F-1', qrCode: 'QR-AH-0068' },
    { id: 'inv-6', name: 'Llave de torque 1"', code: 'LT-9090', category: 'Herramientas', quantity: 1, status: 'LOANED', location: 'Herramientas', qrCode: 'QR-LT-9090', laserMarked: true, calibrationDue: shiftDays(120), certificate: 'CAL-2026-012' },
    { id: 'inv-7', name: 'Micrómetro 0-25 mm', code: 'MIC-025', category: 'Metrología', quantity: 1, status: 'AVAILABLE', location: 'Metrología', qrCode: 'QR-MIC-025', calibrationDue: shiftDays(15), certificate: 'CAL-2026-020' },
    { id: 'inv-8', name: 'Comparador de carátula', code: 'CMP-001', category: 'Metrología', quantity: 1, status: 'AVAILABLE', location: 'Metrología', qrCode: 'QR-CMP-001', calibrationDue: shiftDays(-5), certificate: 'CAL-2025-099' },
    { id: 'inv-9', name: 'Cable eléctrico 12 AWG', code: 'CE-8080', category: 'Eléctrica', quantity: 120, status: 'AVAILABLE', location: 'Estante D-4', qrCode: 'QR-CE-8080' },
  ];

  const loans: Loan[] = [
    { id: 'loan-1', itemId: 'inv-6', receivedBy: 'u-op-mach-1', authorizedBy: 'u-warehouse-1', loanedAt: shiftDays(-4), status: 'ACTIVE' },
    { id: 'loan-2', itemId: 'inv-7', receivedBy: 'u-quality-1', authorizedBy: 'u-warehouse-2', loanedAt: shiftDays(-12), returnedAt: shiftDays(-8), status: 'RETURNED' },
  ];

  const projects: Project[] = [
    {
      id: 'project-1', name: 'Repotenciación turbina GE 7E', clientId: 'cli-ferrominera', ownerId: 'u-eng-1',
      phase: 'ENGINEERING', progress: 25, startDate: shiftDays(-30), dueDate: shiftDays(60),
      milestones: [
        { id: 'pm-1', name: 'Ingeniería básica', phase: 'ENGINEERING', status: 'COMPLETED', date: shiftDays(-20) },
        { id: 'pm-2', name: 'Ingeniería de detalle', phase: 'ENGINEERING', status: 'IN_PROGRESS', date: shiftDays(5) },
        { id: 'pm-3', name: 'Procura de equipos', phase: 'PROCUREMENT', status: 'PENDING' },
        { id: 'pm-4', name: 'Montaje y comisionamiento', phase: 'CONSTRUCTION', status: 'PENDING' },
      ],
    },
    {
      id: 'project-2', name: 'Reparación integral turbina vapor La Pastora', clientId: 'cli-pastora', ownerId: 'u-eng-2',
      phase: 'CONSTRUCTION', progress: 60, startDate: shiftDays(-45), dueDate: shiftDays(30),
      milestones: [
        { id: 'pm-5', name: 'Diagnóstico e ingeniería', phase: 'ENGINEERING', status: 'COMPLETED', date: shiftDays(-35) },
        { id: 'pm-6', name: 'Procura de repuestos', phase: 'PROCUREMENT', status: 'COMPLETED', date: shiftDays(-15) },
        { id: 'pm-7', name: 'Reparación y montaje', phase: 'CONSTRUCTION', status: 'IN_PROGRESS', date: shiftDays(10) },
        { id: 'pm-8', name: 'Pruebas y comisionamiento', phase: 'COMMISSIONING', status: 'PENDING' },
      ],
    },
  ];

  const audit: AuditEntry[] = [
    { id: 'audit-1', userId: 'u-sales-2', userName: 'Carlos Gutiérrez', action: 'CREATE', entity: 'Orden de servicio', entityId: '510000001915', detail: 'Orden creada para Central Azucarero La Pastora.', createdAt: shiftDays(-16) },
    { id: 'audit-2', userId: 'u-workshop', userName: 'Ricardo Bonilla', action: 'CREATE', entity: 'Inspección', entityId: 'INS-2026-001', detail: 'Inspección creada desde la ODS 510000001915.', createdAt: shiftDays(-14) },
    { id: 'audit-3', userId: 'u-workshop', userName: 'Ricardo Bonilla', action: 'APPROVE', entity: 'Inspección', entityId: 'INS-2026-001', detail: 'Inspección aprobada y enviada a Ingeniería.', createdAt: shiftDays(-11) },
    { id: 'audit-4', userId: 'u-eng-1', userName: 'Luis Herrera', action: 'CREATE', entity: 'Hoja de ruta', entityId: 'HR-2026-001', detail: 'Hoja de ruta creada desde la inspección INS-2026-001.', createdAt: shiftDays(-10) },
    { id: 'audit-5', userId: 'u-project', userName: 'Rafael Paredes', action: 'APPROVE', entity: 'Hoja de ruta', entityId: 'HR-2026-001', detail: 'Hoja de ruta aprobada y liberada a taller.', createdAt: shiftDays(-8) },
    { id: 'audit-6', userId: 'u-op-mach-1', userName: 'Andrés Molina', action: 'COMPLETE', entity: 'Tarea', entityId: 'route-001-task-03', detail: 'Mecanizado de superficie de biela completado.', createdAt: shiftDays(-5) },
    { id: 'audit-7', userId: 'u-quality-1', userName: 'Valentina Suárez', action: 'APPROVE', entity: 'Hoja de ruta', entityId: 'HR-2026-005', detail: 'Visto bueno final de Calidad.', createdAt: shiftDays(-1) },
    { id: 'audit-8', userId: 'u-sales', userName: 'María Pérez', action: 'DELIVER', entity: 'Hoja de ruta', entityId: 'HR-2026-006', detail: 'Entrega confirmada al cliente Ferrominera.', createdAt: shiftDays(-9) },
  ];

  return {
    users: USERS,
    clients: CLIENTS,
    assets: ASSETS,
    serviceOrders,
    inspections,
    routeSheets,
    tasks,
    spareRequests,
    inventory,
    loans,
    projects,
    audit,
  };
}
