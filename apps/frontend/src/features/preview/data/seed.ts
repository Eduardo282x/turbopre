import type {
  AreaId,
  Asset,
  AuditAction,
  AuditEntry,
  Client,
  Component,
  FieldJob,
  InventoryItem,
  Loan,
  NewPartInput,
  NonConformity,
  Part,
  Phase,
  PreviewDatabase,
  Project,
  QualityRecord,
  RouteSheet,
  RouteStatus,
  ServiceOrder,
  ServiceTemplate,
  SparePart,
  SupplyOrder,
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
  { id: 'u-camila', name: 'Camila Torres', username: 'camila.torres', email: 'camila@turbopre.com', role: 'FIELD', areaId: 'field_engineering', active: true, createdAt: shiftDays(-160) },
  { id: 'u-rafael', name: 'Rafael Paredes', username: 'rafael.paredes', email: 'rafael@turbopre.com', role: 'PROJECT', areaId: 'projects', active: true, createdAt: shiftDays(-160) },
  { id: 'u-elena', name: 'Elena Nava', username: 'elena.nava', email: 'elena@turbopre.com', role: 'NDT', areaId: 'field_engineering', active: true, createdAt: shiftDays(-150) },
  { id: 'u-jorge', name: 'Jorge Medina', username: 'jorge.medina', email: 'jorge@turbopre.com', role: 'METROLOGY', areaId: 'metrology', active: true, createdAt: shiftDays(-150) },
  { id: 'u-patricia', name: 'Patricia Silva', username: 'patricia.silva', email: 'patricia@turbopre.com', role: 'HSE', areaId: 'admin', active: true, createdAt: shiftDays(-140) },
  { id: 'u-giovanny', name: 'Giovanny Castellano', username: 'giovanny.castellano', email: 'giovanny@turbopre.com', role: 'PROCUREMENT', areaId: 'supply', active: true, createdAt: shiftDays(-140) },
  { id: 'u-ricardo-jefe', name: 'Ricardo Bonilla', username: 'ricardo.jefe', email: 'ricardo.jefe@turbopre.com', role: 'SECTION_CHIEF', areaId: 'assembly', active: true, createdAt: shiftDays(-130) },
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

export const ASSETS: Asset[] = [
  { id: 'asset-1', clientId: 'cli-1', type: 'GAS_TURBINE', manufacturer: 'Siemens', model: 'W501 FD3', serial: 'W501-8842', tag: 'GT-101', ratedPower: '180 MW', technology: 'Gas / W501', location: 'Planta Maracaibo' },
  { id: 'asset-2', clientId: 'cli-2', type: 'GAS_TURBINE', manufacturer: 'Rolls Royce', model: 'Avon', serial: 'AVON-5510', tag: 'GT-204', ratedPower: 'Gas', technology: 'Avon', location: 'PetroPiar' },
  { id: 'asset-3', clientId: 'cli-5', type: 'GAS_TURBINE', manufacturer: 'Elliot', model: 'TG-500', serial: 'ELL-3301', tag: 'GT-305', ratedPower: 'Gas', technology: 'Elliot', location: 'Carbones del Zulia' },
  { id: 'asset-4', clientId: 'cli-4', type: 'GAS_TURBINE', manufacturer: 'General Electric', model: '7E', serial: 'GE7E-7721', tag: 'GT-410', ratedPower: '85 MW', technology: 'MS 5001 / 7E', location: 'Ferrominera' },
  { id: 'asset-5', clientId: 'cli-6', type: 'STEAM_TURBINE', manufacturer: 'Siemens', model: 'SST-600', serial: 'SST-600-19', tag: 'ST-501', ratedPower: '400 MW', technology: 'Vapor', location: 'Complejo Industrial' },
  { id: 'asset-6', clientId: 'cli-3', type: 'STEAM_TURBINE', manufacturer: 'General Electric', model: 'ST-300', serial: 'ST300-118', tag: 'ST-602', ratedPower: '150 MW', technology: 'Vapor', location: 'Cementos Caribe' },
  { id: 'asset-7', clientId: 'cli-1', type: 'GENERATOR', manufacturer: 'General Electric', model: '7FH2', serial: '7FH2-4451', tag: 'GEN-701', ratedPower: '450 MW', technology: 'Generador', location: 'PDVSA Refinación' },
  { id: 'asset-8', clientId: 'cli-2', type: 'GENERATOR', manufacturer: 'Siemens', model: 'SGen-3000W', serial: 'SG-3000-88', tag: 'GEN-702', ratedPower: '250 MW', technology: 'Generador', location: 'PetroPiar' },
  { id: 'asset-9', clientId: 'cli-3', type: 'COMPRESSOR', manufacturer: 'Siemens', model: 'STC-SV', serial: 'STC-8812', tag: 'K-801', ratedPower: 'Compresión', technology: 'Centrífugo', location: 'Cementos Caribe' },
  { id: 'asset-10', clientId: 'cli-1', type: 'CONTROL_SYSTEM', manufacturer: 'General Electric', model: 'Mark VIe', serial: 'MKVIE-2026', tag: 'CS-901', ratedPower: 'Control', technology: 'Mark VIe', location: 'PDVSA Refinación' },
  { id: 'asset-11', clientId: 'cli-6', type: 'GAS_TURBINE', manufacturer: 'General Electric', model: '7FA', serial: 'GE7FA-6620', tag: 'GT-411', ratedPower: '170 MW', technology: '7FA', location: 'Servicios Petroleros Andinos' },
  { id: 'asset-12', clientId: 'cli-5', type: 'STEAM_TURBINE', manufacturer: 'Elliot', model: 'ST-250', serial: 'ELL-250-77', tag: 'ST-603', ratedPower: '120 MW', technology: 'Vapor', location: 'Carbones del Zulia' },
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

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    id: 'tpl-gas-combustion',
    name: 'Inspección de combustión · Turbina a gas',
    mode: 'FIELD',
    scope: 'COMBUSTION_INSPECTION',
    description: 'Inspección visual remota, revisión de combustión y sustitución de componentes según hallazgos.',
    items: [
      { areaId: 'field_engineering', name: 'Inspección visual remota (videoscopia)', type: 'INSPECTION', qualityType: 'VISUAL' },
      { areaId: 'field_gas', name: 'Inspección de combustión y componentes', type: 'WORK', requiresDocument: 'Reporte de combustión' },
      { areaId: 'field_engineering', name: 'NDT de componentes críticos', type: 'INSPECTION', qualityType: 'NDT', requiresDocument: 'Reporte NDT' },
      { areaId: 'quality', name: 'Liberación de calidad', type: 'QUALITY', qualityType: 'FINAL' },
    ],
  },
  {
    id: 'tpl-gas-hot-path',
    name: 'Paso de gases calientes · Turbina a gas',
    mode: 'SHOP',
    scope: 'HOT_GAS_PATH',
    description: 'Sustitución de cestos, inyectores, piezas de transición, álabes y toberas.',
    items: [
      { areaId: 'assembly', name: 'Desensamble y preparación', type: 'WORK' },
      { areaId: 'special_welding', name: 'Reparación de componentes de combustión', type: 'WORK' },
      { areaId: 'thermal_coatings', name: 'Recubrimiento TBC', type: 'WORK', qualityType: 'COATING', requiresDocument: 'Certificado de recubrimiento' },
      { areaId: 'machining_major', name: 'Mecanizado y ajuste', type: 'WORK' },
      { areaId: 'balancing', name: 'Balanceo de rotor', type: 'WORK', qualityType: 'BALANCE', requiresDocument: 'Reporte de balanceo' },
      { areaId: 'quality', name: 'Liberación de calidad', type: 'QUALITY', qualityType: 'FINAL' },
    ],
  },
  {
    id: 'tpl-gas-major',
    name: 'Mantenimiento mayor · Turbina a gas',
    mode: 'SHOP',
    scope: 'MAJOR_OVERHAUL',
    description: 'Intervención integral de componentes estáticos y dinámicos, incluyendo rotor y control.',
    items: [
      { areaId: 'assembly', name: 'Desensamble mayor', type: 'WORK' },
      { areaId: 'machining_major', name: 'Mecanizado de rotores y carcasas', type: 'WORK' },
      { areaId: 'special_welding', name: 'Soldadura especial', type: 'WORK' },
      { areaId: 'thermal_coatings', name: 'Tratamiento térmico y recubrimientos', type: 'WORK', qualityType: 'HEAT_TREATMENT' },
      { areaId: 'balancing', name: 'Balanceo de baja velocidad', type: 'WORK', qualityType: 'BALANCE' },
      { areaId: 'quality', name: 'Pruebas y liberación final', type: 'QUALITY', qualityType: 'FINAL' },
    ],
  },
  {
    id: 'tpl-steam-rotor',
    name: 'Reparación de rotor · Turbina a vapor',
    mode: 'SHOP',
    scope: 'STEAM_ROTOR_REPAIR',
    description: 'Enderezamiento, álabes, muñones, discos, sellos, balanceo y mecanizado.',
    items: [
      { areaId: 'field_steam', name: 'Inspección NDT en sitio', type: 'INSPECTION', qualityType: 'NDT' },
      { areaId: 'assembly', name: 'Extracción y desensamble del rotor', type: 'WORK' },
      { areaId: 'machining_major', name: 'Mecanizado de muñones y sellos', type: 'WORK' },
      { areaId: 'special_welding', name: 'Reparación por soldadura', type: 'WORK' },
      { areaId: 'balancing', name: 'Balanceo del rotor', type: 'WORK', qualityType: 'BALANCE' },
      { areaId: 'quality', name: 'Liberación dimensional y final', type: 'QUALITY', qualityType: 'DIMENSIONAL' },
    ],
  },
  {
    id: 'tpl-generator-stator',
    name: 'Mantenimiento de estator · Generador',
    mode: 'SHOP',
    scope: 'GENERATOR_STATOR',
    description: 'Limpieza, inspección, recubrimiento y pruebas eléctricas del estator.',
    items: [
      { areaId: 'generator_shop', name: 'Limpieza y recubrimiento glyptal', type: 'WORK' },
      { areaId: 'thermal_coatings', name: 'Tratamiento de secado', type: 'WORK', qualityType: 'HEAT_TREATMENT' },
      { areaId: 'quality', name: 'Pruebas eléctricas del estator', type: 'QUALITY', qualityType: 'ELECTRICAL', requiresDocument: 'Reporte eléctrico' },
    ],
  },
  {
    id: 'tpl-generator-rewind',
    name: 'Rebobinado de estator · Generador',
    mode: 'SHOP',
    scope: 'GENERATOR_REWIND',
    description: 'Retiro de bobinas, fabricación, instalación, curado y pruebas finales.',
    items: [
      { areaId: 'generator_shop', name: 'Retiro de cuñas y bobinas', type: 'WORK' },
      { areaId: 'generator_shop', name: 'Fabricación e instalación de bobinas', type: 'WORK' },
      { areaId: 'thermal_coatings', name: 'Curado, resina y secado', type: 'WORK', qualityType: 'HEAT_TREATMENT' },
      { areaId: 'quality', name: 'Pruebas eléctricas finales', type: 'QUALITY', qualityType: 'ELECTRICAL', requiresDocument: 'Certificado de pruebas' },
    ],
  },
  {
    id: 'tpl-shop-balancing',
    name: 'Balanceo dinámico',
    mode: 'SHOP',
    scope: 'SHOP_BALANCING',
    description: 'Balanceo de baja velocidad hasta 800 RPM.',
    items: [
      { areaId: 'balancing', name: 'Montaje y balanceo', type: 'WORK', qualityType: 'BALANCE', requiresDocument: 'Reporte de balanceo' },
      { areaId: 'quality', name: 'Verificación final', type: 'QUALITY', qualityType: 'FINAL' },
    ],
  },
  {
    id: 'tpl-ndt',
    name: 'Ensayos no destructivos',
    mode: 'FIELD',
    scope: 'NDT',
    description: 'VT, PT, MT, UT, Phased Array, Eddy Current y monitoreo de condiciones.',
    items: [
      { areaId: 'field_engineering', name: 'Preparación y acceso', type: 'WORK' },
      { areaId: 'field_engineering', name: 'Ensayo NDT', type: 'INSPECTION', qualityType: 'NDT', requiresDocument: 'Reporte NDT' },
      { areaId: 'quality', name: 'Revisión de resultados', type: 'QUALITY', qualityType: 'FINAL' },
    ],
  },
  {
    id: 'tpl-project',
    name: 'Proyecto electromecánico',
    mode: 'PROJECT',
    scope: 'FIELD_PROJECT',
    description: 'Ingeniería, procura, construcción, precomisionamiento y comisionamiento.',
    items: [
      { areaId: 'projects', name: 'Ingeniería básica y de detalle', type: 'WORK', requiresDocument: 'Memoria de cálculo' },
      { areaId: 'projects', name: 'Procura nacional e internacional', type: 'WORK' },
      { areaId: 'projects', name: 'Construcción y montaje', type: 'WORK' },
      { areaId: 'projects', name: 'Precomisionamiento y comisionamiento', type: 'INSPECTION', qualityType: 'FINAL' },
      { areaId: 'quality', name: 'Cierre y aceptación', type: 'QUALITY', qualityType: 'FINAL' },
    ],
  },
  {
    id: 'tpl-supply',
    name: 'Suministro de componentes',
    mode: 'SUPPLY',
    scope: 'SUPPLY_COMPONENTS',
    description: 'Cotización, compra o fabricación, inspección y despacho de componentes.',
    items: [
      { areaId: 'supply', name: 'Cotización y procura', type: 'WORK' },
      { areaId: 'quality', name: 'Inspección de recepción', type: 'INSPECTION', qualityType: 'VISUAL' },
      { areaId: 'material_warehouse', name: 'Despacho y entrega', type: 'WORK' },
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
  assembly: 'u-ricardo-jefe',
  machining_major: 'u-andres',
  machining_minor: 'u-daniella',
  balancing: 'u-pedro',
  special_welding: 'u-jose',
  generator_shop: 'u-jhon',
  thermal_coatings: 'u-miguel',
  metrology: 'u-jorge',
  material_warehouse: 'u-marta',
  admin: 'u-ana',
  field_gas: 'u-camila',
  field_steam: 'u-camila',
  field_generator: 'u-camila',
  field_engineering: 'u-elena',
  projects: 'u-rafael',
  supply: 'u-giovanny',
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
  assembly: 'Izamiento, desensamble y ensamble',
  machining_major: 'Mecanizado mayor y recuperación',
  machining_minor: 'Mecanizado menor y ajuste',
  balancing: 'Balanceo dinámico a baja velocidad',
  special_welding: 'Soldadura especial certificada',
  generator_shop: 'Mantenimiento de generador',
  thermal_coatings: 'Tratamiento térmico y recubrimientos',
  metrology: 'Verificación y calibración',
  material_warehouse: 'Preparación y despacho de materiales',
  admin: 'Revisión administrativa',
  field_gas: 'Servicio de campo en turbina a gas',
  field_steam: 'Servicio de campo en turbina a vapor',
  field_generator: 'Servicio de campo en generador',
  field_engineering: 'Inspección NDT y monitoreo de condiciones',
  projects: 'Etapa de proyecto electromecánico',
  supply: 'Gestión de suministro',
};

function phaseTypeForArea(areaId: AreaId): Phase['type'] {
  if (areaId === 'quality') return 'QUALITY';
  if (['workshop', 'field_engineering', 'metrology'].includes(areaId)) return 'INSPECTION';
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

export const SERVICE_ORDERS: ServiceOrder[] = [
  {
    id: 'so-001', code: 'EXP-2026-001', mode: 'SHOP', status: 'IN_EXECUTION', clientId: 'cli-1', assetId: 'asset-1',
    site: 'Refinería Maracaibo', scope: 'HOT_GAS_PATH',
    description: 'Inspección de paso de gases calientes y recuperación de componentes de combustión.',
    priority: 'CRITICAL', createdAt: shiftDays(-18), dueDate: shiftDays(8), createdBy: 'u-carlos', approvedBy: 'u-luis',
    approvedAt: shiftDays(-15), routeSheetId: 'route-001',
  },
  {
    id: 'so-002', code: 'EXP-2026-002', mode: 'SHOP', status: 'IN_QUALITY', clientId: 'cli-1', assetId: 'asset-7',
    site: 'PDVSA Refinación', scope: 'GENERATOR_REWIND',
    description: 'Rebobinado de estator y pruebas eléctricas finales del generador GE 7FH2.',
    priority: 'HIGH', createdAt: shiftDays(-25), dueDate: shiftDays(3), createdBy: 'u-carlos', approvedBy: 'u-luis',
    approvedAt: shiftDays(-22), routeSheetId: 'route-005',
  },
  {
    id: 'so-003', code: 'EXP-2026-003', mode: 'SHOP', status: 'APPROVED', clientId: 'cli-5', assetId: 'asset-3',
    site: 'Carbones del Zulia', scope: 'STEAM_ROTOR_REPAIR',
    description: 'Reparación de rotor de turbina a vapor: muñones, sellos, álabes y balanceo.',
    priority: 'HIGH', createdAt: shiftDays(-20), dueDate: shiftDays(12), createdBy: 'u-carlos', approvedBy: 'u-luis',
    approvedAt: shiftDays(-17), routeSheetId: 'route-004',
  },
  {
    id: 'so-004', code: 'EXP-2026-004', mode: 'FIELD', status: 'IN_EXECUTION', clientId: 'cli-2', assetId: 'asset-2',
    site: 'PetroPiar · Jusepín', scope: 'COMBUSTION_INSPECTION',
    description: 'Inspección de combustión en turbina Rolls Royce Avon con videoscopia y NDT.',
    priority: 'HIGH', createdAt: shiftDays(-8), dueDate: shiftDays(5), createdBy: 'u-carlos', approvedBy: 'u-luis',
    approvedAt: shiftDays(-6),
  },
  {
    id: 'so-005', code: 'EXP-2026-005', mode: 'FIELD', status: 'PLANNING', clientId: 'cli-6', assetId: 'asset-5',
    site: 'Complejo Industrial', scope: 'STEAM_ROTOR_REPAIR',
    description: 'Inspección NDT en sitio y preparación para extracción de rotor de turbina a vapor.',
    priority: 'MEDIUM', createdAt: shiftDays(-3), dueDate: shiftDays(18), createdBy: 'u-carlos',
  },
  {
    id: 'so-006', code: 'EXP-2026-006', mode: 'FIELD', status: 'READY_FOR_DELIVERY', clientId: 'cli-2', assetId: 'asset-8',
    site: 'PetroPiar', scope: 'GENERATOR_STATOR',
    description: 'Mantenimiento de estator, secado y pruebas eléctricas en sitio.',
    priority: 'MEDIUM', createdAt: shiftDays(-30), dueDate: shiftDays(-2), createdBy: 'u-carlos', approvedBy: 'u-luis',
    approvedAt: shiftDays(-27),
  },
  {
    id: 'so-007', code: 'EXP-2026-007', mode: 'PROJECT', status: 'PLANNING', clientId: 'cli-4', assetId: 'asset-4',
    site: 'Ferrominera Orinoco', scope: 'FIELD_PROJECT',
    description: 'Repotenciación de turbina GE 7E: ingeniería, procura y montaje electromecánico.',
    priority: 'HIGH', createdAt: shiftDays(-15), dueDate: shiftDays(45), createdBy: 'u-rafael',
  },
  {
    id: 'so-008', code: 'EXP-2026-008', mode: 'PROJECT', status: 'IN_EXECUTION', clientId: 'cli-1', assetId: 'asset-11',
    site: 'PDVSA Refinación', scope: 'FIELD_PROJECT',
    description: 'Montaje electromecánico y balance de planta para turbina GE 7FA.',
    priority: 'CRITICAL', createdAt: shiftDays(-40), dueDate: shiftDays(20), createdBy: 'u-rafael', approvedBy: 'u-luis',
    approvedAt: shiftDays(-35),
  },
  {
    id: 'so-009', code: 'EXP-2026-009', mode: 'SUPPLY', status: 'IN_EXECUTION', clientId: 'cli-1', assetId: 'asset-1',
    site: 'PDVSA Refinación', scope: 'SUPPLY_COMPONENTS',
    description: 'Suministro de álabes, cestos combustores e inyectores para Siemens W501 FD3.',
    priority: 'HIGH', createdAt: shiftDays(-5), dueDate: shiftDays(15), createdBy: 'u-giovanny',
  },
  {
    id: 'so-010', code: 'EXP-2026-010', mode: 'SUPPLY', status: 'DELIVERED', clientId: 'cli-6', assetId: 'asset-9',
    site: 'Servicios Petroleros Andinos', scope: 'SUPPLY_CONTROL_SYSTEMS',
    description: 'Suministro e instalación de sistema de control y monitoreo para compresor centrífugo.',
    priority: 'MEDIUM', createdAt: shiftDays(-30), dueDate: shiftDays(-5), createdBy: 'u-giovanny', approvedBy: 'u-luis',
    approvedAt: shiftDays(-28),
  },
  {
    id: 'so-011', code: 'EXP-2026-011', mode: 'SHOP', status: 'DIAGNOSIS', clientId: 'cli-3', assetId: 'asset-9',
    site: 'Cementos Caribe', scope: 'SHOP_BALANCING',
    description: 'Diagnóstico y balanceo dinámico de rotor de compresor centrífugo.',
    priority: 'MEDIUM', createdAt: shiftDays(-2), dueDate: shiftDays(14), createdBy: 'u-carlos',
  },
  {
    id: 'so-012', code: 'EXP-2026-012', mode: 'FIELD', status: 'DIAGNOSIS', clientId: 'cli-3', assetId: 'asset-6',
    site: 'Cementos Caribe', scope: 'NDT',
    description: 'Ensayos no destructivos y monitoreo de condiciones en turbina a vapor.',
    priority: 'MEDIUM', createdAt: shiftDays(-1), dueDate: shiftDays(10), createdBy: 'u-elena',
  },
];

export const FIELD_JOBS: FieldJob[] = [
  {
    id: 'field-1', serviceOrderId: 'so-004', siteName: 'PetroPiar · Jusepín', location: 'Jusepín, Monagas',
    permits: 'Permiso de trabajo en caliente PT-2026-045', riskAnalysis: 'AST-2026-045 aprobado',
    crew: ['Pedro Salas', 'José Gómez', 'Elena Nava'], mobilizationDate: shiftDays(-6), containers: 2,
    cranes: 'Grúa telescópica 150 t', status: 'IN_EXECUTION', report: 'Inspección de combustión en curso. Componentes de transición con desgaste leve.',
  },
  {
    id: 'field-2', serviceOrderId: 'so-005', siteName: 'Complejo Industrial', location: 'Maracaibo, Zulia',
    permits: 'Pendiente permiso de acceso', riskAnalysis: 'AST preliminar', crew: ['Camila Torres', 'Elena Nava'],
    containers: 1, cranes: 'Por definir', status: 'PLANNED',
  },
  {
    id: 'field-3', serviceOrderId: 'so-006', siteName: 'PetroPiar', location: 'Puerto La Cruz, Anzoátegui',
    permits: 'PT-2026-031', riskAnalysis: 'AST-2026-031', crew: ['Camila Torres', 'Jhon Ramírez'],
    mobilizationDate: shiftDays(-28), demobilizationDate: shiftDays(-4), containers: 2, cranes: 'Grúa 50 t',
    status: 'DEMOBILIZED', report: 'Pruebas eléctricas completadas. Pendiente aceptación del cliente.',
  },
  {
    id: 'field-4', serviceOrderId: 'so-012', siteName: 'Cementos Caribe', location: 'Maracaibo, Zulia',
    permits: 'PT-2026-052', riskAnalysis: 'AST-2026-052', crew: ['Elena Nava'], mobilizationDate: shiftDays(-1),
    containers: 1, cranes: 'No aplica', status: 'MOBILIZED', report: 'Levantamiento NDT inicial.',
  },
];

export const PROJECTS: Project[] = [
  {
    id: 'project-1', serviceOrderId: 'so-007', name: 'Repotenciación GE 7E', phase: 'ENGINEERING', progress: 25,
    milestones: [
      { id: 'pm-1', name: 'Ingeniería básica', phase: 'ENGINEERING', status: 'COMPLETED', date: shiftDays(-10) },
      { id: 'pm-2', name: 'Ingeniería de detalle', phase: 'ENGINEERING', status: 'IN_PROGRESS', date: shiftDays(5) },
      { id: 'pm-3', name: 'Procura de equipos', phase: 'PROCUREMENT', status: 'PENDING' },
      { id: 'pm-4', name: 'Montaje electromecánico', phase: 'CONSTRUCTION', status: 'PENDING' },
      { id: 'pm-5', name: 'Comisionamiento', phase: 'COMMISSIONING', status: 'PENDING' },
    ],
  },
  {
    id: 'project-2', serviceOrderId: 'so-008', name: 'Montaje GE 7FA', phase: 'CONSTRUCTION', progress: 60,
    milestones: [
      { id: 'pm-6', name: 'Ingeniería y procura', phase: 'ENGINEERING', status: 'COMPLETED', date: shiftDays(-30) },
      { id: 'pm-7', name: 'Obras preliminares', phase: 'CONSTRUCTION', status: 'COMPLETED', date: shiftDays(-20) },
      { id: 'pm-8', name: 'Montaje de turbogenerador', phase: 'CONSTRUCTION', status: 'IN_PROGRESS', date: shiftDays(10) },
      { id: 'pm-9', name: 'Precomisionamiento', phase: 'PRECOMMISSIONING', status: 'PENDING' },
      { id: 'pm-10', name: 'Comisionamiento', phase: 'COMMISSIONING', status: 'PENDING' },
    ],
  },
];

export const SUPPLY_ORDERS: SupplyOrder[] = [
  {
    id: 'supply-1', serviceOrderId: 'so-009', status: 'PURCHASED', supplier: 'Siemens Energy',
    purchaseOrder: 'PO-2026-0088', expectedDate: shiftDays(10),
    items: [
      { id: 'si-1', name: 'Álabes de turbina', code: 'AL-W501', quantity: 6, status: 'PURCHASED' },
      { id: 'si-2', name: 'Cestos combustores', code: 'CC-W501', quantity: 4, status: 'PURCHASED' },
      { id: 'si-3', name: 'Inyectores de combustible', code: 'IN-W501', quantity: 8, status: 'REQUESTED' },
    ],
  },
  {
    id: 'supply-2', serviceOrderId: 'so-010', status: 'DELIVERED', supplier: 'GE Vernova',
    purchaseOrder: 'PO-2026-0044', expectedDate: shiftDays(-8), deliveredAt: shiftDays(-5),
    items: [
      { id: 'si-4', name: 'Módulo de control Mark VIe', code: 'MKVIE-01', quantity: 1, status: 'DELIVERED' },
      { id: 'si-5', name: 'Sensores de vibración', code: 'SV-220', quantity: 8, status: 'DELIVERED' },
    ],
  },
];

export const QUALITY_RECORDS: QualityRecord[] = [
  { id: 'qr-1', serviceOrderId: 'so-001', routeSheetId: 'route-001', type: 'NDT', method: 'Ultrasonido', standard: 'ASME V', acceptanceCriteria: 'Sin indicaciones mayores a 2 mm', result: 'PASS', inspectorId: 'u-elena', certificate: 'NDT-2026-045', testedAt: shiftDays(-5), notes: 'Componentes de combustión conformes.' },
  { id: 'qr-2', serviceOrderId: 'so-001', routeSheetId: 'route-001', type: 'BALANCE', method: 'Balanceo baja velocidad', standard: 'ISO 1940', acceptanceCriteria: 'Grado G2.5', result: 'PENDING', inspectorId: 'u-pedro' },
  { id: 'qr-3', serviceOrderId: 'so-002', routeSheetId: 'route-005', type: 'ELECTRICAL', method: 'IR / HI-POT / EL CID', standard: 'IEEE 43', acceptanceCriteria: 'IR > 100 MΩ', result: 'PASS', inspectorId: 'u-valentina', certificate: 'EL-2026-018', testedAt: shiftDays(-4) },
  { id: 'qr-4', serviceOrderId: 'so-003', routeSheetId: 'route-004', type: 'NDT', method: 'Tintes penetrantes', standard: 'ASME V', acceptanceCriteria: 'Sin grietas', result: 'PASS', inspectorId: 'u-elena', certificate: 'NDT-2026-041', testedAt: shiftDays(-8) },
  { id: 'qr-5', serviceOrderId: 'so-006', type: 'ELECTRICAL', method: 'Resistencia de aislamiento', standard: 'IEEE 43', acceptanceCriteria: 'IR > 100 MΩ', result: 'PASS', inspectorId: 'u-valentina', certificate: 'EL-2026-021', testedAt: shiftDays(-5) },
  { id: 'qr-6', serviceOrderId: 'so-005', type: 'NDT', method: 'Partículas magnéticas', standard: 'ASME V', acceptanceCriteria: 'Sin indicaciones', result: 'FAIL', inspectorId: 'u-elena', testedAt: shiftDays(-2), notes: 'Fisura detectada en álabe de primera etapa.' },
  { id: 'qr-7', serviceOrderId: 'so-004', type: 'VISUAL', method: 'Videoscopia', standard: 'Procedimiento interno', acceptanceCriteria: 'Sin daño crítico', result: 'PASS', inspectorId: 'u-elena', testedAt: shiftDays(-3) },
  { id: 'qr-8', serviceOrderId: 'so-008', type: 'DIMENSIONAL', method: 'Control dimensional', standard: 'Plan de montaje', acceptanceCriteria: 'Tolerancias de alineación', result: 'PENDING', inspectorId: 'u-jorge' },
  { id: 'qr-9', serviceOrderId: 'so-011', type: 'BALANCE', method: 'Balanceo dinámico', standard: 'ISO 1940', acceptanceCriteria: 'Grado G2.5', result: 'PENDING', inspectorId: 'u-pedro' },
  { id: 'qr-10', serviceOrderId: 'so-009', type: 'VISUAL', method: 'Inspección de recepción', standard: 'Certificado de material', acceptanceCriteria: 'Sin daños y certificados completos', result: 'PENDING', inspectorId: 'u-valentina' },
];

export const NON_CONFORMITIES: NonConformity[] = [
  { id: 'nc-1', serviceOrderId: 'so-005', description: 'Fisura detectada en álabe de primera etapa durante NDT.', severity: 'HIGH', status: 'OPEN', correctiveAction: 'Evaluar reparación por soldadura o sustitución del álabe.', responsibleId: 'u-camila', createdAt: shiftDays(-2) },
  { id: 'nc-2', serviceOrderId: 'so-001', description: 'Porosidad en soldadura de carcasa.', severity: 'MEDIUM', status: 'IN_PROGRESS', correctiveAction: 'Reprocesar soldadura y repetir PT.', responsibleId: 'u-jose', createdAt: shiftDays(-6) },
  { id: 'nc-3', serviceOrderId: 'so-002', description: 'Resistencia de aislamiento por debajo del criterio en fase inicial.', severity: 'HIGH', status: 'IN_PROGRESS', correctiveAction: 'Repetir secado y pruebas eléctricas.', responsibleId: 'u-valentina', createdAt: shiftDays(-3) },
  { id: 'nc-4', serviceOrderId: 'so-004', description: 'Falta certificado de material de componente de transición.', severity: 'LOW', status: 'CLOSED', correctiveAction: 'Se recibió certificado del proveedor.', responsibleId: 'u-giovanny', createdAt: shiftDays(-7), closedAt: shiftDays(-5) },
];

function buildServiceOrderRouteSheet(
  order: ServiceOrder,
  index: number,
  template: ServiceTemplate,
  components: Component[],
): { routeSheet: RouteSheet; part: Part; phases: Phase[] } {
  const asset = ASSETS.find((item) => item.id === order.assetId);
  const componentId = asset ? `comp-${asset.id}` : components[0]?.id ?? 'comp-1';
  const routeId = `route-${order.id}`;
  const partId = `part-${order.id}`;
  const now = new Date().toISOString();
  const routeStatus: RouteStatus =
    order.status === 'IN_EXECUTION'
      ? 'IN_PROGRESS'
      : order.status === 'IN_QUALITY'
        ? 'IN_QUALITY'
        : order.status === 'READY_FOR_DELIVERY'
          ? 'READY_FOR_DELIVERY'
          : ['DELIVERED', 'CLOSED'].includes(order.status)
            ? 'DELIVERED'
            : order.status === 'APPROVED'
              ? 'APPROVED'
              : 'DRAFT';

  const phases: Phase[] = template.items.map((item, phaseIndex) => {
    const completed =
      ['READY_FOR_DELIVERY', 'DELIVERED', 'CLOSED'].includes(order.status) ||
      (order.status === 'IN_QUALITY' && item.type !== 'QUALITY') ||
      (order.status === 'IN_EXECUTION' && phaseIndex === 0);
    const inProgress =
      !completed &&
      ((order.status === 'IN_EXECUTION' && phaseIndex === 1) ||
        (order.status === 'IN_QUALITY' && item.type === 'QUALITY'));
    const status = completed
      ? 'COMPLETED'
      : inProgress
        ? 'IN_PROGRESS'
        : phaseIndex === 0
          ? 'PENDING'
          : 'BLOCKED';
    const completedAt = completed ? shiftFrom(order.createdAt, Math.max(1, phaseIndex + 1)) : undefined;
    return {
      id: `phase-${order.id}-${phaseIndex + 1}`,
      routeSheetId: routeId,
      partId,
      areaId: item.areaId,
      order: (phaseIndex + 1) * 10,
      name: item.name,
      description: item.requiresDocument
        ? `${item.name}. Documento requerido: ${item.requiresDocument}.`
        : item.name,
      type: item.type,
      status,
      responsibleId: USERS.find((user) => user.areaId === item.areaId && user.active)?.id,
      startedAt: completed || inProgress ? shiftFrom(order.createdAt, Math.max(0, phaseIndex)) : undefined,
      completedAt,
      observations: completed ? 'Registro de demostración del proceso.' : undefined,
      evidence: completed ? EVIDENCE_PLACEHOLDER : undefined,
    };
  });

  const partCompleted = phases.every((phase) => phase.status === 'COMPLETED');
  const partStarted = phases.some((phase) => phase.status === 'COMPLETED' || phase.status === 'IN_PROGRESS');
  const currentPhase =
    phases.find((phase) => phase.status === 'IN_PROGRESS') ??
    phases.find((phase) => phase.status === 'PENDING') ??
    phases[phases.length - 1];

  const part: Part = {
    id: partId,
    routeSheetId: routeId,
    name: asset ? `${asset.manufacturer} ${asset.model} · ${template.name}` : template.name,
    quantity: 1,
    status: partCompleted ? 'COMPLETED' : partStarted ? 'IN_PROGRESS' : 'PENDING',
    areaId: currentPhase?.areaId ?? template.items[0]?.areaId ?? 'workshop',
  };

  return {
    routeSheet: {
      id: routeId,
      code: `HR-2026-${String(16 + index).padStart(3, '0')}`,
      componentId,
      clientId: order.clientId,
      serviceOrderId: order.id,
      templateId: template.id,
      description: order.description,
      status: routeStatus,
      priority: order.priority,
      createdAt: order.createdAt,
      updatedAt: now,
      dueDate: order.dueDate,
      createdBy: order.createdBy,
      approvedBy: order.approvedBy,
      approvedAt: order.approvedAt,
      deliveredAt: ['DELIVERED', 'CLOSED'].includes(order.status) ? shiftFrom(order.dueDate, -1) : undefined,
      observations: order.observations,
    },
    part,
    phases,
  };
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

  const components: Component[] = [
    ...COMPONENTS,
    ...ASSETS.map((asset) => ({
      id: `comp-${asset.id}`,
      name: `${asset.manufacturer} ${asset.model}`,
      serial: asset.serial,
      type: asset.type,
    })),
  ];

  const serviceRouteSheets: RouteSheet[] = [];
  const serviceParts: Part[] = [];
  const servicePhases: Phase[] = [];
  const serviceOrders: ServiceOrder[] = SERVICE_ORDERS.map((order, index) => {
    const template =
      SERVICE_TEMPLATES.find((item) => item.scope === order.scope) ??
      SERVICE_TEMPLATES.find((item) => item.mode === order.mode);
    if (!template) return order;
    const generated = buildServiceOrderRouteSheet(order, index, template, components);
    serviceRouteSheets.push(generated.routeSheet);
    serviceParts.push(generated.part);
    servicePhases.push(...generated.phases);
    return { ...order, routeSheetId: generated.routeSheet.id };
  });

  const allRouteSheets = [...routeSheets, ...serviceRouteSheets];
  const allParts = [...parts, ...serviceParts];
  const allPhases = [...phases, ...servicePhases];

  const inventory: InventoryItem[] = [
    { id: 'inv-1', name: 'Rodamiento SKF 6205', code: 'RD-1001', category: 'Mecánica', quantity: 12, status: 'AVAILABLE', location: 'Estante A-1', qrCode: 'QR-RD-1001', certificate: 'CERT-MAT-001', controlledAtmosphere: true },
    { id: 'inv-2', name: 'Sello mecánico 2"', code: 'SM-2024', category: 'Hidráulica', quantity: 4, status: 'AVAILABLE', location: 'Estante B-2', qrCode: 'QR-SM-2024', certificate: 'CERT-MAT-002' },
    { id: 'inv-3', name: 'Válvula neumática 1/2', code: 'VN-5050', category: 'Neumática', quantity: 7, status: 'AVAILABLE', location: 'Estante C-1', qrCode: 'QR-VN-5050' },
    { id: 'inv-4', name: 'Cable eléctrico 12 AWG', code: 'CE-8080', category: 'Eléctrica', quantity: 120, status: 'AVAILABLE', location: 'Estante D-4', qrCode: 'QR-CE-8080' },
    { id: 'inv-5', name: 'Llave de torque 1"', code: 'LT-9090', category: 'Manual', quantity: 2, status: 'LOANED', location: 'Herramientas', qrCode: 'QR-LT-9090', laserMarked: true, calibrationDue: shiftDays(120), certificate: 'CAL-2026-012' },
    { id: 'inv-6', name: 'Electrodo E7018', code: 'EL-7018', category: 'Soldadura', quantity: 38, status: 'AVAILABLE', location: 'Estante E-2', qrCode: 'QR-EL-7018', certificate: 'CERT-CONS-018', controlledAtmosphere: true },
    { id: 'inv-7', name: 'Aceite hidráulico ISO 68', code: 'AH-0068', category: 'Lubricantes', quantity: 9, status: 'AVAILABLE', location: 'Estante F-1', qrCode: 'QR-AH-0068' },
    { id: 'inv-8', name: 'Micrómetro digital 0-25 mm', code: 'MD-0025', category: 'Metrología', quantity: 0, status: 'OUT_OF_STOCK', location: 'Metrología', qrCode: 'QR-MD-0025', laserMarked: true, calibrationDue: shiftDays(-12), certificate: 'CAL-2025-088' },
    { id: 'inv-9', name: 'Disco de corte 4 1/2"', code: 'DC-0450', category: 'Consumibles', quantity: 25, status: 'AVAILABLE', location: 'Estante G-3', qrCode: 'QR-DC-0450' },
    { id: 'inv-10', name: 'Juego de llaves mixtas', code: 'LM-1200', category: 'Manual', quantity: 1, status: 'LOANED', location: 'Herramientas', qrCode: 'QR-LM-1200', laserMarked: true },
    { id: 'inv-11', name: 'Colector de datos multicanal', code: 'CD-3200', category: 'Monitoreo', quantity: 1, status: 'AVAILABLE', location: 'Metrología', qrCode: 'QR-CD-3200', laserMarked: true, calibrationDue: shiftDays(60), certificate: 'CAL-2026-031' },
    { id: 'inv-12', name: 'Videoscopio industrial', code: 'VS-8800', category: 'Inspección', quantity: 1, status: 'AVAILABLE', location: 'Metrología', qrCode: 'QR-VS-8800', laserMarked: true, calibrationDue: shiftDays(15), certificate: 'CAL-2026-044' },
    { id: 'inv-13', name: 'Equipo PMI portátil', code: 'PMI-4400', category: 'Laboratorio', quantity: 1, status: 'AVAILABLE', location: 'Laboratorio', qrCode: 'QR-PMI-4400', laserMarked: true, calibrationDue: shiftDays(200), certificate: 'CAL-2026-050' },
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
    components,
    assets: ASSETS,
    serviceOrders,
    serviceTemplates: SERVICE_TEMPLATES,
    fieldJobs: FIELD_JOBS,
    projects: PROJECTS,
    supplyOrders: SUPPLY_ORDERS,
    qualityRecords: QUALITY_RECORDS,
    nonConformities: NON_CONFORMITIES,
    routeSheets: allRouteSheets,
    parts: allParts,
    phases: allPhases,
    spareParts,
    inventory,
    loans,
    audit,
  };
}
