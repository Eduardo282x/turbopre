import type {
  AreaId,
  AuditAction,
  AuditEntry,
  Client,
  Component,
  InventoryItem,
  Loan,
  NewPartInput,
  Part,
  Phase,
  PreviewDatabase,
  RouteStatus,
  SparePart,
  User,
} from '../types';

const NOW = new Date();

function shiftDays(days: number, hours = 0): string {
  const date = new Date(NOW);
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function shiftFrom(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

const EVIDENCE_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#0f1621"/><rect x="24" y="24" width="592" height="312" rx="12" fill="#151d2b" stroke="#263349"/><circle cx="320" cy="150" r="34" fill="none" stroke="#00d1ff" stroke-width="3"/><path d="M296 150l16 16 32-34" fill="none" stroke="#22c55e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><text x="320" y="232" fill="#e6edf7" font-family="sans-serif" font-size="20" text-anchor="middle">Evidencia fotográfica de taller</text><text x="320" y="262" fill="#9aa9c0" font-family="sans-serif" font-size="14" text-anchor="middle">Registro de demostración</text></svg>',
)}`;

export const USERS: User[] = [
  { id: 'u-ana', name: 'Ana Rivas', username: 'ana.rivas', email: 'ana@turbopre.com', role: 'GLOBAL', active: true, createdAt: shiftDays(-320) },
  { id: 'u-carlos', name: 'Carlos Méndez', username: 'carlos.mendez', email: 'carlos@turbopre.com', role: 'PLANNING', areaId: 'planning', active: true, createdAt: shiftDays(-300) },
  { id: 'u-luis', name: 'Luis Herrera', username: 'luis.herrera', email: 'luis@turbopre.com', role: 'ENGINEERING', areaId: 'engineering', active: true, createdAt: shiftDays(-300) },
  { id: 'u-maria', name: 'María Pérez', username: 'maria.perez', email: 'maria@turbopre.com', role: 'SALES', areaId: 'sales', active: true, createdAt: shiftDays(-280) },
  { id: 'u-ricardo', name: 'Ricardo Bonilla', username: 'ricardo.bonilla', email: 'ricardo@turbopre.com', role: 'WORKSHOP', areaId: 'workshop', active: true, createdAt: shiftDays(-260) },
  { id: 'u-pedro', name: 'Pedro Salas', username: 'pedro.salas', email: 'pedro@turbopre.com', role: 'OPERATOR', areaId: 'turbines', active: true, createdAt: shiftDays(-240) },
  { id: 'u-jose', name: 'José Gómez', username: 'jose.gomez', email: 'jose@turbopre.com', role: 'OPERATOR', areaId: 'welding', active: true, createdAt: shiftDays(-240) },
  { id: 'u-andres', name: 'Andrés Molina', username: 'andres.molina', email: 'andres@turbopre.com', role: 'OPERATOR', areaId: 'machining', active: true, createdAt: shiftDays(-230) },
  { id: 'u-jhon', name: 'Jhon Ramírez', username: 'jhon.ramirez', email: 'jhon@turbopre.com', role: 'OPERATOR', areaId: 'generators', active: true, createdAt: shiftDays(-230) },
  { id: 'u-juan', name: 'Juan Almacén', username: 'juan.almacen', email: 'juan@turbopre.com', role: 'WAREHOUSE', areaId: 'warehouse', active: true, createdAt: shiftDays(-210) },
  { id: 'u-valentina', name: 'Valentina Suárez', username: 'valentina.suarez', email: 'valentina@turbopre.com', role: 'QUALITY', areaId: 'quality', active: true, createdAt: shiftDays(-210) },
  { id: 'u-daniella', name: 'Daniella Ríos', username: 'daniella.rios', email: 'daniella@turbopre.com', role: 'OPERATOR', areaId: 'machining', active: true, createdAt: shiftDays(-190) },
  { id: 'u-miguel', name: 'Miguel Ortega', username: 'miguel.ortega', email: 'miguel@turbopre.com', role: 'OPERATOR', areaId: 'welding', active: true, createdAt: shiftDays(-190) },
  { id: 'u-fernando', name: 'Fernando León', username: 'fernando.leon', email: 'fernando@turbopre.com', role: 'OPERATOR', areaId: 'turbines', active: true, createdAt: shiftDays(-180) },
  { id: 'u-marta', name: 'Marta Almacén', username: 'marta.almacen', email: 'marta@turbopre.com', role: 'WAREHOUSE', areaId: 'warehouse', active: true, createdAt: shiftDays(-170) },
  { id: 'u-hector', name: 'Héctor Mendoza', username: 'hector.mendoza', email: 'hector@turbopre.com', role: 'QUALITY', areaId: 'quality', active: true, createdAt: shiftDays(-170) },
];

export const CLIENTS: Client[] = [
  { id: 'cli-1', name: 'PDVSA Refinación', code: 'PDV', contact: 'Ing. Mariana Salas', email: 'msalas@pdvsa-refinacion.com', phone: '+58 212 555-0101' },
  { id: 'cli-2', name: 'PetroPiar', code: 'PPI', contact: 'Ing. Rubén Cedeño', email: 'rcedeno@petropiar.com', phone: '+58 285 555-0202' },
  { id: 'cli-3', name: 'Cementos Caribe', code: 'CCB', contact: 'Ing. Adriana Pacheco', email: 'apacheco@cementoscaribe.com', phone: '+58 212 555-0303' },
  { id: 'cli-4', name: 'Ferrominera Orinoco', code: 'FMO', contact: 'Ing. Manuel Rondón', email: 'mrondon@ferrominera.com', phone: '+58 286 555-0404' },
  { id: 'cli-5', name: 'Carbones del Zulia', code: 'CDZ', contact: 'Ing. Sofía Urdaneta', email: 'surdaneta@carboneszulia.com', phone: '+58 261 555-0505' },
  { id: 'cli-6', name: 'Servicios Petroleros Andinos', code: 'SPA', contact: 'Ing. Gustavo Peña', email: 'gpena@spa-andinos.com', phone: '+58 274 555-0606' },
];

export const COMPONENTS: Component[] = [
  { id: 'comp-1', name: 'Cojinete Radial de Alta C7', serial: 'CR-12345', type: 'Rotativo' },
  { id: 'comp-2', name: 'Rotor de Turbina TV-300', serial: 'RT-300-88', type: 'Rotativo' },
  { id: 'comp-3', name: 'Sello Mecánico 2"', serial: 'SM-2024', type: 'Sellado' },
  { id: 'comp-4', name: 'Eje de Transmisión', serial: 'ET-5510', type: 'Transmisión' },
  { id: 'comp-5', name: 'Carcasa de Bomba', serial: 'CB-8842', type: 'Estructura' },
  { id: 'comp-6', name: 'Álabes de Turbina', serial: 'AL-7719', type: 'Rotativo' },
  { id: 'comp-7', name: 'Cople Flexible', serial: 'CF-3301', type: 'Acople' },
  { id: 'comp-8', name: 'Brida de Sujeción', serial: 'BR-9021', type: 'Estructura' },
  { id: 'comp-9', name: 'Ventilador Industrial', serial: 'VI-6604', type: 'Ventilación' },
  { id: 'comp-10', name: 'Generador Eléctrico G-250', serial: 'GE-250-17', type: 'Eléctrico' },
  { id: 'comp-11', name: 'Buje de Bronce', serial: 'BB-4408', type: 'Fricción' },
  { id: 'comp-12', name: 'Volante de Inercia', serial: 'VI-8812', type: 'Rotativo' },
];

interface RouteSeed {
  id: string;
  code: string;
  componentId: string;
  clientId: string;
  description: string;
  status: RouteStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdOffset: number;
  dueOffset: number;
  parts: Array<Pick<NewPartInput, 'name' | 'quantity' | 'areas'>>;
}

const ROUTE_SEEDS: RouteSeed[] = [
  {
    id: 'route-001', code: 'HR-2026-001', componentId: 'comp-1', clientId: 'cli-1',
    description: 'Inspección y rehabilitación de cojinete fijo de alta presión.',
    status: 'IN_PROGRESS', priority: 'HIGH', createdOffset: -18, dueOffset: 8,
    parts: [
      { name: 'Cojinete fijo', quantity: 1, areas: ['turbines', 'machining', 'quality'] },
      { name: 'Buje de bronce', quantity: 2, areas: ['machining', 'quality'] },
    ],
  },
  {
    id: 'route-002', code: 'HR-2026-002', componentId: 'comp-2', clientId: 'cli-2',
    description: 'Rehabilitación de rotor de turbina con recuperación de álabes.',
    status: 'IN_REVIEW', priority: 'CRITICAL', createdOffset: -9, dueOffset: 14,
    parts: [
      { name: 'Álabes de turbina', quantity: 6, areas: ['turbines', 'welding', 'quality'] },
      { name: 'Eje del rotor', quantity: 1, areas: ['machining', 'quality'] },
      { name: 'Carcasa de rotor', quantity: 1, areas: ['welding', 'quality'] },
    ],
  },
  {
    id: 'route-003', code: 'HR-2026-003', componentId: 'comp-3', clientId: 'cli-3',
    description: 'Fabricación de sello mecánico de 2 pulgadas para bomba de proceso.',
    status: 'DRAFT', priority: 'MEDIUM', createdOffset: -3, dueOffset: 20,
    parts: [
      { name: 'Sello primario', quantity: 2, areas: ['machining', 'quality'] },
      { name: 'Sello secundario', quantity: 2, areas: ['machining', 'quality'] },
    ],
  },
  {
    id: 'route-004', code: 'HR-2026-004', componentId: 'comp-4', clientId: 'cli-4',
    description: 'Reparación de eje de transmisión con rectificado y balanceo.',
    status: 'APPROVED', priority: 'HIGH', createdOffset: -6, dueOffset: 10,
    parts: [
      { name: 'Eje principal', quantity: 1, areas: ['machining', 'turbines', 'quality'] },
    ],
  },
  {
    id: 'route-005', code: 'HR-2026-005', componentId: 'comp-5', clientId: 'cli-5',
    description: 'Recuperación de carcasa de bomba con soldadura y mecanizado.',
    status: 'IN_QUALITY', priority: 'HIGH', createdOffset: -22, dueOffset: 3,
    parts: [
      { name: 'Carcasa inferior', quantity: 1, areas: ['welding', 'machining', 'quality'] },
      { name: 'Carcasa superior', quantity: 1, areas: ['welding', 'quality'] },
    ],
  },
  {
    id: 'route-006', code: 'HR-2026-006', componentId: 'comp-6', clientId: 'cli-1',
    description: 'Fabricación y ajuste de juego de álabes para turbina de vapor.',
    status: 'READY_FOR_DELIVERY', priority: 'MEDIUM', createdOffset: -30, dueOffset: -2,
    parts: [
      { name: 'Álabe guía', quantity: 4, areas: ['machining', 'welding', 'quality'] },
      { name: 'Álabe móvil', quantity: 4, areas: ['machining', 'quality'] },
    ],
  },
  {
    id: 'route-007', code: 'HR-2026-007', componentId: 'comp-7', clientId: 'cli-2',
    description: 'Suministro de cople flexible para generador de respaldo.',
    status: 'DELIVERED', priority: 'LOW', createdOffset: -52, dueOffset: -20,
    parts: [
      { name: 'Cople flexible', quantity: 1, areas: ['machining', 'quality'] },
    ],
  },
  {
    id: 'route-008', code: 'HR-2026-008', componentId: 'comp-8', clientId: 'cli-6',
    description: 'Mecanizado de brida de sujeción para línea de alta presión.',
    status: 'IN_PROGRESS', priority: 'MEDIUM', createdOffset: -12, dueOffset: 9,
    parts: [
      { name: 'Brida de sujeción', quantity: 2, areas: ['machining', 'quality'] },
      { name: 'Espárragos', quantity: 8, areas: ['machining', 'quality'] },
    ],
  },
  {
    id: 'route-009', code: 'HR-2026-009', componentId: 'comp-9', clientId: 'cli-3',
    description: 'Fabricación de ventilador industrial para extracción de gases.',
    status: 'DELIVERED', priority: 'MEDIUM', createdOffset: -65, dueOffset: -30,
    parts: [
      { name: 'Impulsor', quantity: 1, areas: ['turbines', 'machining', 'quality'] },
      { name: 'Eje del ventilador', quantity: 1, areas: ['machining', 'quality'] },
    ],
  },
  {
    id: 'route-010', code: 'HR-2026-010', componentId: 'comp-10', clientId: 'cli-4',
    description: 'Mantenimiento mayor de generador eléctrico G-250.',
    status: 'IN_PROGRESS', priority: 'CRITICAL', createdOffset: -15, dueOffset: 5,
    parts: [
      { name: 'Rotor del generador', quantity: 1, areas: ['generators', 'turbines', 'quality'] },
      { name: 'Estator', quantity: 1, areas: ['generators', 'quality'] },
    ],
  },
  {
    id: 'route-011', code: 'HR-2026-011', componentId: 'comp-11', clientId: 'cli-5',
    description: 'Fabricación de bujes de bronce para bomba centrífuga.',
    status: 'IN_REVIEW', priority: 'MEDIUM', createdOffset: -8, dueOffset: 16,
    parts: [
      { name: 'Buje de bronce', quantity: 4, areas: ['machining', 'quality'] },
    ],
  },
  {
    id: 'route-012', code: 'HR-2026-012', componentId: 'comp-12', clientId: 'cli-6',
    description: 'Balanceo dinámico de volante de inercia.',
    status: 'DRAFT', priority: 'LOW', createdOffset: -2, dueOffset: 22,
    parts: [
      { name: 'Volante de inercia', quantity: 1, areas: ['turbines', 'machining', 'quality'] },
    ],
  },
  {
    id: 'route-013', code: 'HR-2026-013', componentId: 'comp-2', clientId: 'cli-1',
    description: 'Reparación de rotor por fisura en álabe de primera etapa.',
    status: 'IN_QUALITY', priority: 'CRITICAL', createdOffset: -25, dueOffset: 1,
    parts: [
      { name: 'Álabe primera etapa', quantity: 3, areas: ['welding', 'machining', 'quality'] },
      { name: 'Disco del rotor', quantity: 1, areas: ['turbines', 'quality'] },
    ],
  },
  {
    id: 'route-014', code: 'HR-2026-014', componentId: 'comp-4', clientId: 'cli-2',
    description: 'Mecanizado de eje de transmisión para compresor de gas.',
    status: 'READY_FOR_DELIVERY', priority: 'HIGH', createdOffset: -34, dueOffset: -4,
    parts: [
      { name: 'Eje de transmisión', quantity: 1, areas: ['machining', 'turbines', 'quality'] },
    ],
  },
  {
    id: 'route-015', code: 'HR-2026-015', componentId: 'comp-3', clientId: 'cli-3',
    description: 'Sustitución de sello mecánico en bomba de agua de enfriamiento.',
    status: 'DELIVERED', priority: 'MEDIUM', createdOffset: -44, dueOffset: -12,
    parts: [
      { name: 'Sello mecánico', quantity: 2, areas: ['machining', 'quality'] },
    ],
  },
];

const AREA_USER: Record<string, string | undefined> = {
  planning: 'u-carlos',
  engineering: 'u-luis',
  turbines: 'u-pedro',
  machining: 'u-andres',
  welding: 'u-jose',
  generators: 'u-jhon',
  workshop: 'u-ricardo',
  warehouse: 'u-juan',
  quality: 'u-valentina',
  sales: 'u-maria',
};

const AREA_PHASE_NAME: Record<string, string> = {
  planning: 'Revisión de planos y alcance',
  engineering: 'Validación técnica y liberación',
  turbines: 'Preparación y ejecución en turbinas',
  machining: 'Mecanizado y verificación dimensional',
  welding: 'Soldadura y tratamiento térmico',
  generators: 'Limpieza abrasiva y montaje',
  workshop: 'Inspección y reporte de taller',
  quality: 'Liberación de calidad',
  warehouse: 'Preparación de materiales',
  sales: 'Confirmación con el cliente',
};

function phaseTypeForArea(areaId: AreaId): Phase['type'] {
  if (areaId === 'quality') return 'QUALITY';
  if (areaId === 'workshop') return 'INSPECTION';
  return 'WORK';
}

function buildPhaseStatus(
  routeStatus: RouteStatus,
  phaseIndex: number,
  totalPhases: number,
  partIndex: number,
  phaseType: Phase['type'],
): Phase['status'] {
  if (routeStatus === 'DRAFT' || routeStatus === 'IN_REVIEW' || routeStatus === 'APPROVED') {
    return phaseIndex === 0 ? 'PENDING' : 'BLOCKED';
  }
  if (routeStatus === 'IN_QUALITY') {
    return phaseType === 'QUALITY' ? 'IN_PROGRESS' : 'COMPLETED';
  }
  if (routeStatus === 'READY_FOR_DELIVERY' || routeStatus === 'DELIVERED') {
    return 'COMPLETED';
  }

  const completedRatio = partIndex === 0 ? 0.5 : partIndex === 1 ? 0.25 : 0;
  const completedCount = Math.max(0, Math.floor(totalPhases * completedRatio));
  if (phaseIndex < completedCount) return 'COMPLETED';
  if (phaseIndex === completedCount) return 'IN_PROGRESS';
  return 'BLOCKED';
}

export function seedDatabase(): PreviewDatabase {
  const parts: Part[] = [];
  const phases: Phase[] = [];
  const spareParts: SparePart[] = [];
  const routeSheets = ROUTE_SEEDS.map((seed) => {
    const createdAt = shiftDays(seed.createdOffset);
    const dueDate = shiftDays(seed.dueOffset);
    const approved = !['DRAFT', 'IN_REVIEW'].includes(seed.status);
    const route = {
      id: seed.id,
      code: seed.code,
      componentId: seed.componentId,
      clientId: seed.clientId,
      description: seed.description,
      status: seed.status,
      priority: seed.priority,
      createdAt,
      updatedAt: shiftDays(Math.min(seed.createdOffset + 2, -1)),
      dueDate,
      createdBy: 'u-carlos',
      approvedBy: approved ? 'u-luis' : undefined,
      approvedAt: approved ? shiftDays(Math.min(seed.createdOffset + 2, -1)) : undefined,
      deliveredAt: seed.status === 'DELIVERED' ? shiftDays(seed.dueOffset - 1) : undefined,
      observations:
        seed.status === 'DELIVERED'
          ? 'Expediente cerrado y entregado al cliente. Documentación archivada.'
          : seed.status === 'IN_QUALITY'
            ? 'Pendiente de revisión final de calidad y anexos de ingeniería.'
            : undefined,
    };

    seed.parts.forEach((partSeed, partIndex) => {
      const partId = `${seed.id}-part-${partIndex + 1}`;
      const partPhases: Phase[] = partSeed.areas.map((areaId, phaseIndex) => {
        const phaseId = `${partId}-phase-${phaseIndex + 1}`;
        const type = phaseTypeForArea(areaId);
        const status = buildPhaseStatus(seed.status, phaseIndex, partSeed.areas.length, partIndex, type);
        const completed = status === 'COMPLETED';
        const inProgress = status === 'IN_PROGRESS';
        const completedAt = completed
          ? new Date(
              Math.min(
                NOW.getTime(),
                new Date(createdAt).getTime() + (phaseIndex + 1) * 86400000 * 1.4,
              ),
            ).toISOString()
          : undefined;

        return {
          id: phaseId,
          routeSheetId: seed.id,
          partId,
          areaId,
          order: (phaseIndex + 1) * 10,
          name: AREA_PHASE_NAME[areaId] ?? 'Ejecución de fase',
          description:
            type === 'QUALITY'
              ? 'Verificar dimensiones, acabado y evidencias antes de liberar la parte.'
              : type === 'INSPECTION'
                ? 'Registrar hallazgos, mediciones y evidencias del área.'
                : 'Ejecutar la actividad según el plan de la hoja de ruta y registrar el avance.',
          type,
          status,
          responsibleId: AREA_USER[areaId],
          startedAt: completed || inProgress ? new Date(new Date(createdAt).getTime() + phaseIndex * 86400000).toISOString() : undefined,
          completedAt,
          observations: completed && phaseIndex % 2 === 1 ? 'Sin novedades durante la ejecución.' : undefined,
          evidence: completed && phaseIndex % 3 === 1 ? EVIDENCE_PLACEHOLDER : undefined,
        };
      });

      const partCompleted = partPhases.every((phase) => phase.status === 'COMPLETED');
      const partInProgress = partPhases.some((phase) => phase.status === 'COMPLETED' || phase.status === 'IN_PROGRESS');
      const currentArea = partPhases.find((phase) => phase.status === 'IN_PROGRESS')?.areaId
        ?? partPhases.find((phase) => phase.status === 'PENDING')?.areaId
        ?? partPhases[partPhases.length - 1]?.areaId
        ?? 'workshop';

      parts.push({
        id: partId,
        routeSheetId: seed.id,
        name: partSeed.name,
        quantity: partSeed.quantity,
        status: partCompleted ? 'COMPLETED' : partInProgress ? 'IN_PROGRESS' : 'PENDING',
        areaId: currentArea,
      });
      phases.push(...partPhases);
    });

    if (['IN_PROGRESS', 'IN_QUALITY', 'READY_FOR_DELIVERY', 'DELIVERED'].includes(seed.status)) {
      const spareCatalog = [
        { name: 'Rodamiento SKF 6205', code: 'RD-1001' },
        { name: 'Sello mecánico 2"', code: 'SM-2024' },
        { name: 'Electrodo E7018', code: 'EL-7018' },
        { name: 'Aceite hidráulico ISO 68', code: 'AH-0068' },
      ];
      const count = seed.id === 'route-001' ? 3 : 2;
      Array.from({ length: count }).forEach((_, index) => {
        const item = spareCatalog[(seed.id.length + index) % spareCatalog.length];
        const status = index === 0 ? 'PENDING' : index === 1 ? 'APPROVED' : 'DISPATCHED';
        spareParts.push({
          id: `${seed.id}-spare-${index + 1}`,
          routeSheetId: seed.id,
          partId: `${seed.id}-part-1`,
          name: item.name,
          code: item.code,
          quantity: index + 1,
          areaId: seed.parts[0]?.areas[0] ?? 'workshop',
          status,
          requestedBy: 'u-ricardo',
          requestedAt: shiftDays(Math.min(seed.createdOffset + 3, -1)),
          dispatchedAt: status === 'DISPATCHED' ? shiftDays(Math.min(seed.createdOffset + 5, -1)) : undefined,
        });
      });
    }

    return route;
  });

  const inventory: InventoryItem[] = [
    { id: 'inv-1', name: 'Rodamiento SKF 6205', code: 'RD-1001', category: 'Mecánica', quantity: 12, status: 'AVAILABLE', location: 'Estante A-1' },
    { id: 'inv-2', name: 'Sello mecánico 2"', code: 'SM-2024', category: 'Hidráulica', quantity: 4, status: 'AVAILABLE', location: 'Estante B-2' },
    { id: 'inv-3', name: 'Válvula neumática 1/2', code: 'VN-5050', category: 'Neumática', quantity: 7, status: 'AVAILABLE', location: 'Estante C-1' },
    { id: 'inv-4', name: 'Cable eléctrico 12 AWG', code: 'CE-8080', category: 'Eléctrica', quantity: 120, status: 'AVAILABLE', location: 'Estante D-4' },
    { id: 'inv-5', name: 'Llave de torque 1"', code: 'LT-9090', category: 'Manual', quantity: 2, status: 'LOANED', location: 'Herramientas' },
    { id: 'inv-6', name: 'Electrodo E7018', code: 'EL-7018', category: 'Soldadura', quantity: 38, status: 'AVAILABLE', location: 'Estante E-2' },
    { id: 'inv-7', name: 'Aceite hidráulico ISO 68', code: 'AH-0068', category: 'Lubricantes', quantity: 9, status: 'AVAILABLE', location: 'Estante F-1' },
    { id: 'inv-8', name: 'Micrómetro digital 0-25 mm', code: 'MD-0025', category: 'Metrología', quantity: 0, status: 'OUT_OF_STOCK', location: 'Metrología' },
    { id: 'inv-9', name: 'Disco de corte 4 1/2"', code: 'DC-0450', category: 'Consumibles', quantity: 25, status: 'AVAILABLE', location: 'Estante G-3' },
    { id: 'inv-10', name: 'Juego de llaves mixtas', code: 'LM-1200', category: 'Manual', quantity: 1, status: 'LOANED', location: 'Herramientas' },
  ];

  const loans: Loan[] = [
    { id: 'loan-1', itemId: 'inv-5', receivedBy: 'Pedro Salas', authorizedBy: 'u-juan', loanedAt: shiftDays(-4), status: 'ACTIVE' },
    { id: 'loan-2', itemId: 'inv-10', receivedBy: 'José Gómez', authorizedBy: 'u-marta', loanedAt: shiftDays(-2), status: 'ACTIVE' },
    { id: 'loan-3', itemId: 'inv-3', receivedBy: 'Andrés Molina', authorizedBy: 'u-juan', loanedAt: shiftDays(-12), returnedAt: shiftDays(-9), status: 'RETURNED' },
    { id: 'loan-4', itemId: 'inv-1', receivedBy: 'Jhon Ramírez', authorizedBy: 'u-marta', loanedAt: shiftDays(-20), returnedAt: shiftDays(-17), status: 'RETURNED' },
  ];

  const audit: AuditEntry[] = [];
  let auditCounter = 1;
  const addAudit = (
    userId: string,
    action: AuditAction,
    entity: string,
    entityId: string,
    detail: string,
    createdAt: string,
  ) => {
    const user = USERS.find((item) => item.id === userId);
    audit.push({
      id: `audit-${String(auditCounter++).padStart(3, '0')}`,
      userId,
      userName: user?.name ?? 'Sistema',
      action,
      entity,
      entityId,
      detail,
      createdAt,
    });
  };

  routeSheets.forEach((route) => {
    addAudit('u-carlos', 'CREATE', 'Hoja de ruta', route.code, `Hoja de ruta creada para ${COMPONENTS.find((component) => component.id === route.componentId)?.name ?? 'componente'}.`, route.createdAt);
    if (route.status !== 'DRAFT') {
      addAudit('u-carlos', 'UPDATE', 'Hoja de ruta', route.code, 'Hoja enviada a revisión técnica.', shiftFrom(route.createdAt, 1));
    }
    if (route.approvedAt) {
      addAudit('u-luis', 'APPROVE', 'Hoja de ruta', route.code, 'Hoja de ruta aprobada por Ingeniería.', route.approvedAt);
    }
    if (['IN_PROGRESS', 'IN_QUALITY', 'READY_FOR_DELIVERY', 'DELIVERED'].includes(route.status)) {
      addAudit('u-ricardo', 'UPDATE', 'Hoja de ruta', route.code, 'Ejecución iniciada en taller.', shiftFrom(route.createdAt, 3));
    }
    if (['IN_QUALITY', 'READY_FOR_DELIVERY', 'DELIVERED'].includes(route.status)) {
      addAudit('u-valentina', 'COMPLETE', 'Calidad', route.code, 'Revisión de calidad registrada.', shiftFrom(route.createdAt, 5));
    }
    if (route.status === 'DELIVERED' && route.deliveredAt) {
      addAudit('u-maria', 'DELIVER', 'Hoja de ruta', route.code, 'Entrega confirmada con el cliente.', route.deliveredAt);
    }
  });

  ['u-ana', 'u-carlos', 'u-luis', 'u-ricardo', 'u-valentina', 'u-maria'].forEach((userId, index) => {
    addAudit(userId, 'LOGIN', 'Sesión', 'preview', 'Ingreso al modo preview.', shiftDays(-1, index));
  });

  return {
    users: USERS,
    clients: CLIENTS,
    components: COMPONENTS,
    routeSheets,
    parts,
    phases,
    spareParts,
    inventory,
    loans,
    audit,
  };
}
