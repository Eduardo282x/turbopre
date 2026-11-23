import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type UserRole } from '../src/generated/prisma/client.js';

const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@turbopre.dev';
const isProduction = process.env.NODE_ENV === 'production';
const ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ?? (isProduction ? '' : 'admin1234');
const ADMIN_NAME = 'Administrador';

if (!ADMIN_PASSWORD) {
  console.error(
    'SEED_ADMIN_PASSWORD es obligatoria cuando NODE_ENV=production. Define una contraseña segura antes de ejecutar el seed.',
  );
  process.exit(1);
}

const DEMO_PASSWORD = 'demo1234';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL no está definida. Configúrala en apps/backend/.env antes de ejecutar el seed.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type DepartmentSeed = {
  code: string;
  name: string;
};

const DEPARTMENTS: DepartmentSeed[] = [
  { code: 'ADMINISTRATION', name: 'Administración' },
  { code: 'SALES', name: 'Mercadeo y Ventas' },
  { code: 'WORKSHOP', name: 'Taller' },
  { code: 'ENGINEERING', name: 'Ingeniería y Soporte Técnico' },
  { code: 'QUALITY', name: 'Calidad' },
  { code: 'PROJECT_MANAGEMENT', name: 'Gerencia de Proyectos' },
  { code: 'WAREHOUSE', name: 'Almacén' },
];

type ProcessSeed = {
  code: string;
  name: string;
  kind: 'WORKSHOP' | 'ENGINEERING' | 'QUALITY' | 'SUPPORT';
  departmentCode: string;
};

const PROCESSES: ProcessSeed[] = [
  // Taller
  { code: 'MACHINING', name: 'Mecanizado', kind: 'WORKSHOP', departmentCode: 'WORKSHOP' },
  { code: 'GENERATORS', name: 'Generadores', kind: 'WORKSHOP', departmentCode: 'WORKSHOP' },
  {
    code: 'ROTATING_EQUIPMENT',
    name: 'Equipos Rotativos (Turbinas)',
    kind: 'WORKSHOP',
    departmentCode: 'WORKSHOP',
  },
  { code: 'WELDING', name: 'Soldadura', kind: 'WORKSHOP', departmentCode: 'WORKSHOP' },
  // Ingeniería y Soporte Técnico
  {
    code: 'DRAWING',
    name: 'Elaboración de Planos',
    kind: 'ENGINEERING',
    departmentCode: 'ENGINEERING',
  },
  {
    code: 'PMI',
    name: 'Prueba Positiva de Materiales (PMI)',
    kind: 'ENGINEERING',
    departmentCode: 'ENGINEERING',
  },
  {
    code: 'SAMPLE_CUTTING',
    name: 'Corte de Muestras',
    kind: 'ENGINEERING',
    departmentCode: 'ENGINEERING',
  },
  {
    code: 'METALLOGRAPHY',
    name: 'Análisis Metalográfico',
    kind: 'ENGINEERING',
    departmentCode: 'ENGINEERING',
  },
  // Calidad
  { code: 'QUALITY', name: 'Calidad', kind: 'QUALITY', departmentCode: 'QUALITY' },
];

type PositionSeed = {
  code: string;
  name: string;
  processCode: string;
};

const JOB_POSITIONS: PositionSeed[] = [
  // Equipos Rotativos (Turbinas)
  {
    code: 'ROTATING_SPECIALIST',
    name: 'TEC. ESP. Equipos Rotativos',
    processCode: 'ROTATING_EQUIPMENT',
  },
  { code: 'MECHANIC_I', name: 'Mecánico I', processCode: 'ROTATING_EQUIPMENT' },
  { code: 'MECHANIC_II', name: 'Mecánico II', processCode: 'ROTATING_EQUIPMENT' },
  {
    code: 'LIFTING_OPERATOR',
    name: 'OPER. de Equipos de Izamiento',
    processCode: 'ROTATING_EQUIPMENT',
  },
  // Generadores
  {
    code: 'ABRASIVE_CLEANER',
    name: 'Operador de Limpieza Abrasiva',
    processCode: 'GENERATORS',
  },
  { code: 'WINDER_I', name: 'Bobinador I', processCode: 'GENERATORS' },
  { code: 'WINDER_II', name: 'Bobinador II', processCode: 'GENERATORS' },
  // Soldadura
  { code: 'WELDER_FI', name: 'Soldador F.I', processCode: 'WELDING' },
  { code: 'WELDER_I', name: 'Soldador I', processCode: 'WELDING' },
  { code: 'WELDER_II', name: 'Soldador II', processCode: 'WELDING' },
  // Mecanizado
  {
    code: 'MACHINE_OPERATOR_I',
    name: 'OPER. de Máquinas y Herramientas I',
    processCode: 'MACHINING',
  },
  {
    code: 'MACHINE_OPERATOR_II',
    name: 'OPER. de Máquinas y Herramientas II',
    processCode: 'MACHINING',
  },
  { code: 'DEBURRER', name: 'Rebabitador', processCode: 'MACHINING' },
  // Calidad
  { code: 'QUALITY_INSPECTOR', name: 'Inspector de Calidad', processCode: 'QUALITY' },
  // Ingeniería y Soporte Técnico
  {
    code: 'DRAWING_ENGINEER',
    name: 'Ingeniero de Elaboración de Planos',
    processCode: 'DRAWING',
  },
  { code: 'PMI_INSPECTOR', name: 'Inspector PMI', processCode: 'PMI' },
  {
    code: 'SAMPLE_CUTTING_TECHNICIAN',
    name: 'Técnico de Corte de Muestras',
    processCode: 'SAMPLE_CUTTING',
  },
  {
    code: 'METALLOGRAPHY_ANALYST',
    name: 'Analista Metalográfico',
    processCode: 'METALLOGRAPHY',
  },
];

async function seedOrganization(): Promise<Map<string, string>> {
  const departmentIds = new Map<string, string>();

  for (const department of DEPARTMENTS) {
    const record = await prisma.department.upsert({
      where: { code: department.code },
      update: { name: department.name, isActive: true },
      create: department,
    });
    departmentIds.set(department.code, record.id);
  }

  const processIds = new Map<string, string>();

  for (const process of PROCESSES) {
    const departmentId = departmentIds.get(process.departmentCode);

    if (!departmentId) {
      throw new Error(`Departamento no encontrado: ${process.departmentCode}`);
    }

    const record = await prisma.process.upsert({
      where: { code: process.code },
      update: { name: process.name, kind: process.kind, departmentId, isActive: true },
      create: {
        code: process.code,
        name: process.name,
        kind: process.kind,
        departmentId,
      },
    });
    processIds.set(process.code, record.id);
  }

  const jobPositionIds = new Map<string, string>();

  for (const position of JOB_POSITIONS) {
    const processId = processIds.get(position.processCode);

    if (!processId) {
      throw new Error(`Proceso no encontrado: ${position.processCode}`);
    }

    const record = await prisma.jobPosition.upsert({
      where: { code: position.code },
      update: { name: position.name, processId, isActive: true },
      create: {
        code: position.code,
        name: position.name,
        processId,
      },
    });
    jobPositionIds.set(position.code, record.id);
  }

  return jobPositionIds;
}

async function seedAdmin(): Promise<string> {
  const passwordHash = await hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {
      email: ADMIN_EMAIL,
      fullName: ADMIN_NAME,
      role: 'ADMIN',
      isActive: true,
      // En producción no se reescribe la contraseña salvo que se pida explícitamente.
      ...(isProduction && !process.env.SEED_ADMIN_PASSWORD ? {} : { passwordHash }),
    },
    create: {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash,
      fullName: ADMIN_NAME,
      role: 'ADMIN',
    },
  });

  console.log(`Usuario administrador listo: ${admin.username} / ${ADMIN_PASSWORD}`);
  return admin.id;
}

type DemoUserSeed = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  jobPositionCode?: string;
};

/**
 * IDs estables iguales a los de la semilla del preview. Mientras el frontend
 * tenga módulos en modo preview, la sesión real y los datos provisionales
 * siguen apuntando al mismo usuario.
 */
const DEMO_USERS: DemoUserSeed[] = [
  {
    id: 'u-admin',
    username: 'ana.rivas',
    fullName: 'Ana Rivas',
    email: 'ana.rivas@turbopre.com',
    role: 'ADMIN',
  },
  {
    id: 'u-sales',
    username: 'maria.perez',
    fullName: 'María Pérez',
    email: 'maria.perez@turbopre.com',
    role: 'SALES',
  },
  {
    id: 'u-sales-2',
    username: 'carlos.gutierrez',
    fullName: 'Carlos Gutiérrez',
    email: 'carlos.gutierrez@turbopre.com',
    role: 'SALES',
  },
  {
    id: 'u-workshop',
    username: 'ricardo.bonilla',
    fullName: 'Ricardo Bonilla',
    email: 'ricardo.bonilla@turbopre.com',
    role: 'WORKSHOP',
  },
  {
    id: 'u-eng-1',
    username: 'luis.herrera',
    fullName: 'Luis Herrera',
    email: 'luis.herrera@turbopre.com',
    role: 'ENGINEER',
    jobPositionCode: 'DRAWING_ENGINEER',
  },
  {
    id: 'u-eng-2',
    username: 'ariannys.bucobo',
    fullName: 'Ariannys Bucobo',
    email: 'ariannys.bucobo@turbopre.com',
    role: 'ENGINEER',
    jobPositionCode: 'PMI_INSPECTOR',
  },
  {
    id: 'u-quality-1',
    username: 'valentina.suarez',
    fullName: 'Valentina Suárez',
    email: 'valentina.suarez@turbopre.com',
    role: 'QUALITY',
    jobPositionCode: 'QUALITY_INSPECTOR',
  },
  {
    id: 'u-quality-2',
    username: 'hector.mendoza',
    fullName: 'Héctor Mendoza',
    email: 'hector.mendoza@turbopre.com',
    role: 'QUALITY',
    jobPositionCode: 'QUALITY_INSPECTOR',
  },
  {
    id: 'u-project',
    username: 'rafael.paredes',
    fullName: 'Rafael Paredes',
    email: 'rafael.paredes@turbopre.com',
    role: 'PROJECT_MANAGER',
  },
  {
    id: 'u-warehouse-1',
    username: 'juan.almacen',
    fullName: 'Juan Almacén',
    email: 'juan.almacen@turbopre.com',
    role: 'WAREHOUSE',
  },
  {
    id: 'u-warehouse-2',
    username: 'marta.almacen',
    fullName: 'Marta Almacén',
    email: 'marta.almacen@turbopre.com',
    role: 'WAREHOUSE',
  },
  {
    id: 'u-op-rot-1',
    username: 'pedro.salas',
    fullName: 'Pedro Salas',
    email: 'pedro.salas@turbopre.com',
    role: 'OPERATOR',
    jobPositionCode: 'ROTATING_SPECIALIST',
  },
  {
    id: 'u-op-rot-2',
    username: 'fernando.leon',
    fullName: 'Fernando León',
    email: 'fernando.leon@turbopre.com',
    role: 'OPERATOR',
    jobPositionCode: 'MECHANIC_I',
  },
  {
    id: 'u-op-mach-1',
    username: 'andres.molina',
    fullName: 'Andrés Molina',
    email: 'andres.molina@turbopre.com',
    role: 'OPERATOR',
    jobPositionCode: 'MACHINE_OPERATOR_I',
  },
  {
    id: 'u-op-mach-2',
    username: 'daniella.rios',
    fullName: 'Daniella Ríos',
    email: 'daniella.rios@turbopre.com',
    role: 'OPERATOR',
    jobPositionCode: 'DEBURRER',
  },
  {
    id: 'u-op-weld-1',
    username: 'jose.gomez',
    fullName: 'José Gómez',
    email: 'jose.gomez@turbopre.com',
    role: 'OPERATOR',
    jobPositionCode: 'WELDER_I',
  },
  {
    id: 'u-op-weld-2',
    username: 'miguel.ortega',
    fullName: 'Miguel Ortega',
    email: 'miguel.ortega@turbopre.com',
    role: 'OPERATOR',
    jobPositionCode: 'WELDER_FI',
  },
  {
    id: 'u-op-gen-1',
    username: 'jhon.ramirez',
    fullName: 'Jhon Ramírez',
    email: 'jhon.ramirez@turbopre.com',
    role: 'OPERATOR',
    jobPositionCode: 'WINDER_I',
  },
];

function shouldSeedDemoUsers(): boolean {
  if (process.env.SEED_DEMO_USERS === 'false') return false;
  if (process.env.SEED_DEMO_USERS === 'true') return true;
  return (process.env.NODE_ENV ?? 'development') !== 'production';
}

async function seedDemoUsers(adminId: string, jobPositionIds: Map<string, string>): Promise<void> {
  if (!shouldSeedDemoUsers()) {
    console.log('Usuarios demo omitidos (SEED_DEMO_USERS=false o NODE_ENV=production).');
    return;
  }

  const passwordHash = await hash(DEMO_PASSWORD, 10);

  for (const demo of DEMO_USERS) {
    const jobPositionId = demo.jobPositionCode
      ? jobPositionIds.get(demo.jobPositionCode)
      : undefined;

    if (demo.jobPositionCode && !jobPositionId) {
      throw new Error(`Puesto no encontrado para ${demo.username}: ${demo.jobPositionCode}`);
    }

    await prisma.user.upsert({
      where: { username: demo.username },
      update: {
        email: demo.email,
        fullName: demo.fullName,
        role: demo.role,
        jobPositionId: jobPositionId ?? null,
        isActive: true,
        passwordHash,
      },
      create: {
        id: demo.id,
        username: demo.username,
        email: demo.email,
        passwordHash,
        fullName: demo.fullName,
        role: demo.role,
        jobPositionId: jobPositionId ?? null,
        createdById: adminId,
      },
    });
  }

  console.log(`Usuarios demo listos: ${DEMO_USERS.length} cuentas / contraseña ${DEMO_PASSWORD}`);
}

function shiftDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

const DEMO_CLIENTS = [
  {
    id: 'cli-pastora',
    code: 'CALP',
    name: 'Central Azucarero La Pastora',
    contactName: 'Ing. Daniel Marval',
    contactEmail: 'dmarval@lapastora.com',
    contactPhone: '+58 424 555-0101',
    address: 'Central Azucarero La Pastora',
  },
  {
    id: 'cli-pdvsa',
    code: 'PGO',
    name: 'PDVSA GOIP',
    contactName: 'Ing. Daniel Marval',
    contactEmail: 'dmarval@pdvsa.com',
    contactPhone: '+58 212 555-0202',
    address: 'Refinería Puerto La Cruz',
  },
  {
    id: 'cli-petropiar',
    code: 'PPI',
    name: 'PetroPiar',
    contactName: 'Ing. Rubén Cedeño',
    contactEmail: 'rcedeno@petropiar.com',
    contactPhone: '+58 285 555-0303',
    address: 'PetroPiar · Jusepín',
  },
  {
    id: 'cli-cementos',
    code: 'CCB',
    name: 'Cementos Caribe',
    contactName: 'Ing. Adriana Pacheco',
    contactEmail: 'apacheco@cementoscaribe.com',
    contactPhone: '+58 212 555-0404',
    address: 'Cementos Caribe',
  },
  {
    id: 'cli-ferrominera',
    code: 'FMO',
    name: 'Ferrominera Orinoco',
    contactName: 'Ing. Manuel Rondón',
    contactEmail: 'mrondon@ferrominera.com',
    contactPhone: '+58 286 555-0505',
    address: 'Ferrominera Orinoco',
  },
];

const DEMO_SITES = [
  {
    id: 'site-pastora',
    clientId: 'cli-pastora',
    name: 'Central Azucarero La Pastora',
    address: 'Central Azucarero La Pastora',
  },
  {
    id: 'site-pdvsa-plc',
    clientId: 'cli-pdvsa',
    name: 'Refinería Puerto La Cruz',
    address: 'Refinería Puerto La Cruz',
  },
  {
    id: 'site-petropiar-jusepin',
    clientId: 'cli-petropiar',
    name: 'PetroPiar · Jusepín',
    address: 'PetroPiar · Jusepín',
  },
  {
    id: 'site-cementos',
    clientId: 'cli-cementos',
    name: 'Cementos Caribe',
    address: 'Cementos Caribe',
  },
  {
    id: 'site-ferrominera',
    clientId: 'cli-ferrominera',
    name: 'Ferrominera Orinoco',
    address: 'Ferrominera Orinoco',
  },
];

const DEMO_EQUIPMENT = [
  {
    id: 'asset-ng-dme500rc',
    clientId: 'cli-pastora',
    code: 'TV-101',
    name: 'Turbina a vapor NG DME 500RC',
    type: 'STEAM_TURBINE',
    manufacturer: 'NG',
    model: 'DME 500RC',
    serialNumber: 'NG-DME-500RC-118',
    notes: 'Turbina a vapor de la desfibradora.',
  },
  {
    id: 'asset-ng-dme500s',
    clientId: 'cli-pastora',
    code: 'RT-102',
    name: 'Rotor de turbina NG DME-500S MOL 4',
    type: 'STEAM_TURBINE',
    manufacturer: 'NG',
    model: 'DME-500S MOL 4',
    serialNumber: 'NG-DME-500S-M4',
    notes: 'Rotor de turbina a vapor.',
  },
  {
    id: 'asset-elliott-mol5',
    clientId: 'cli-pastora',
    code: 'RT-103',
    name: 'Rotor de turbina Elliott MOL 5',
    type: 'STEAM_TURBINE',
    manufacturer: 'Elliott',
    model: 'MOL 5',
    serialNumber: 'ELL-MOL5-77',
    notes: 'Rotor de turbina Elliott.',
  },
  {
    id: 'asset-comp-c7',
    clientId: 'cli-pdvsa',
    code: 'K-201',
    name: 'Compresor GE Alta C7',
    type: 'COMPRESSOR',
    manufacturer: 'General Electric',
    model: 'Alta C7',
    serialNumber: 'C7-1855',
    notes: 'Compresor de alta presión.',
  },
  {
    id: 'asset-gen-7fh2',
    clientId: 'cli-pdvsa',
    code: 'GEN-701',
    name: 'Generador GE 7FH2',
    type: 'GENERATOR',
    manufacturer: 'General Electric',
    model: '7FH2',
    serialNumber: '7FH2-4451',
    notes: null,
  },
  {
    id: 'asset-tg-avon',
    clientId: 'cli-petropiar',
    code: 'GT-204',
    name: 'Turbina a gas Rolls Royce Avon',
    type: 'GAS_TURBINE',
    manufacturer: 'Rolls Royce',
    model: 'Avon',
    serialNumber: 'AVON-5510',
    notes: null,
  },
  {
    id: 'asset-st-300',
    clientId: 'cli-cementos',
    code: 'ST-602',
    name: 'Turbina a vapor GE ST-300',
    type: 'STEAM_TURBINE',
    manufacturer: 'General Electric',
    model: 'ST-300',
    serialNumber: 'ST300-118',
    notes: null,
  },
  {
    id: 'asset-ge-7e',
    clientId: 'cli-ferrominera',
    code: 'GT-410',
    name: 'Turbina a gas GE 7E',
    type: 'GAS_TURBINE',
    manufacturer: 'General Electric',
    model: '7E',
    serialNumber: 'GE7E-7721',
    notes: null,
  },
];

const DEMO_PROJECTS = [
  {
    id: 'project-1',
    code: 'PRY-001',
    name: 'Repotenciación turbina GE 7E',
    clientId: 'cli-ferrominera',
    managerId: 'u-eng-1',
    status: 'ACTIVE' as const,
    startDate: shiftDays(-30),
    dueDate: shiftDays(60),
    notes: 'Fase de ingeniería y procura.',
  },
  {
    id: 'project-2',
    code: 'PRY-002',
    name: 'Reparación integral turbina vapor La Pastora',
    clientId: 'cli-pastora',
    managerId: 'u-eng-2',
    status: 'ACTIVE' as const,
    startDate: shiftDays(-45),
    dueDate: shiftDays(30),
    notes: 'Diagnóstico, procura y montaje.',
  },
];

const DEMO_SERVICE_ORDERS = [
  {
    id: 'so-1915',
    orderNumber: '510000001915',
    clientId: 'cli-pastora',
    siteId: 'site-pastora',
    equipmentId: 'asset-ng-dme500rc',
    projectId: 'project-2',
    createdById: 'u-sales-2',
    description: 'T- DESARME, LIMPIEZA E INSPECCIÓN DE TURBINA A VAPOR MARCA NG MODELO DME 500RC DE LA DESFIBRADORA',
    scope: 'Desarme, limpieza e inspección de turbina a vapor',
    priority: 'HIGH' as const,
    status: 'IN_PROGRESS' as const,
    requestedAt: shiftDays(-16),
    dueAt: shiftDays(10),
  },
  {
    id: 'so-1892',
    orderNumber: '510000001892',
    clientId: 'cli-pastora',
    siteId: 'site-pastora',
    equipmentId: 'asset-ng-dme500s',
    projectId: null,
    createdById: 'u-sales-2',
    description: 'T- LIMPIEZA E INSPECCIÓN DE ROTOR DE TURBINA NG DME-500S MOL 4',
    scope: 'Limpieza e inspección de rotor',
    priority: 'HIGH' as const,
    status: 'IN_PROGRESS' as const,
    requestedAt: shiftDays(-9),
    dueAt: shiftDays(14),
  },
  {
    id: 'so-1916',
    orderNumber: '510000001916',
    clientId: 'cli-pastora',
    siteId: 'site-pastora',
    equipmentId: 'asset-elliott-mol5',
    projectId: null,
    createdById: 'u-sales-2',
    description: 'T- LIMPIEZA E INSPECCIÓN DE ROTOR DE TURBINA ELLIOTT MOL5',
    scope: 'Limpieza e inspección de rotor',
    priority: 'MEDIUM' as const,
    status: 'OPEN' as const,
    requestedAt: shiftDays(-4),
    dueAt: shiftDays(18),
  },
  {
    id: 'so-1855',
    orderNumber: '51-1855',
    clientId: 'cli-pdvsa',
    siteId: 'site-pdvsa-plc',
    equipmentId: 'asset-comp-c7',
    projectId: null,
    createdById: 'u-sales',
    description: 'REHABILITACION DE COJINETES RADIALES DE COMPRESOR DE ALTA C7',
    scope: 'Rehabilitación de cojinetes radiales',
    priority: 'CRITICAL' as const,
    status: 'IN_PROGRESS' as const,
    requestedAt: shiftDays(-20),
    dueAt: shiftDays(5),
  },
  {
    id: 'so-1901',
    orderNumber: '510000001901',
    clientId: 'cli-pdvsa',
    siteId: 'site-pdvsa-plc',
    equipmentId: 'asset-gen-7fh2',
    projectId: null,
    createdById: 'u-sales',
    description: 'MANTENIMIENTO MAYOR DE GENERADOR ELÉCTRICO GE 7FH2',
    scope: 'Mantenimiento mayor de generador',
    priority: 'HIGH' as const,
    status: 'IN_PROGRESS' as const,
    requestedAt: shiftDays(-28),
    dueAt: shiftDays(21),
  },
  {
    id: 'so-1888',
    orderNumber: '510000001888',
    clientId: 'cli-petropiar',
    siteId: 'site-petropiar-jusepin',
    equipmentId: 'asset-tg-avon',
    projectId: null,
    createdById: 'u-sales',
    description: 'INSPECCIÓN DE COMBUSTIÓN EN TURBINA A GAS ROLLS ROYCE AVON',
    scope: 'Inspección de combustión',
    priority: 'MEDIUM' as const,
    status: 'IN_PROGRESS' as const,
    requestedAt: shiftDays(-22),
    dueAt: shiftDays(7),
  },
  {
    id: 'so-1870',
    orderNumber: '510000001870',
    clientId: 'cli-cementos',
    siteId: 'site-cementos',
    equipmentId: 'asset-st-300',
    projectId: null,
    createdById: 'u-sales-2',
    description: 'REPARACIÓN DE ROTOR DE TURBINA A VAPOR GE ST-300',
    scope: 'Reparación de rotor',
    priority: 'HIGH' as const,
    status: 'READY_FOR_DELIVERY' as const,
    requestedAt: shiftDays(-30),
    dueAt: shiftDays(2),
  },
  {
    id: 'so-1802',
    orderNumber: '510000001802',
    clientId: 'cli-ferrominera',
    siteId: 'site-ferrominera',
    equipmentId: 'asset-ge-7e',
    projectId: 'project-1',
    createdById: 'u-sales',
    description: 'MANTENIMIENTO MAYOR DE TURBINA A GAS GE 7E',
    scope: 'Mantenimiento mayor',
    priority: 'MEDIUM' as const,
    status: 'DELIVERED' as const,
    requestedAt: shiftDays(-60),
    dueAt: shiftDays(-5),
    deliveredAt: shiftDays(-1),
  },
  {
    id: 'so-1920',
    orderNumber: '510000001920',
    clientId: 'cli-pastora',
    siteId: 'site-pastora',
    equipmentId: 'asset-ng-dme500rc',
    projectId: null,
    createdById: 'u-sales-2',
    description: 'FABRICACIÓN DE BUJES DE BRONCE PARA TURBINA A VAPOR NG DME 500RC',
    scope: 'Fabricación de bujes de bronce',
    priority: 'LOW' as const,
    status: 'OPEN' as const,
    requestedAt: shiftDays(-6),
    dueAt: shiftDays(30),
  },
  {
    id: 'so-1850',
    orderNumber: '510000001850',
    clientId: 'cli-pdvsa',
    siteId: 'site-pdvsa-plc',
    equipmentId: 'asset-gen-7fh2',
    projectId: null,
    createdById: 'u-sales',
    description: 'REBOBINADO DE ESTATOR DEL GENERADOR GE 7FH2',
    scope: 'Rebobinado de estator',
    priority: 'MEDIUM' as const,
    status: 'IN_PROGRESS' as const,
    requestedAt: shiftDays(-12),
    dueAt: shiftDays(25),
  },
];

async function seedDemoCommercial(): Promise<void> {
  if (!shouldSeedDemoUsers()) {
    console.log('Datos comerciales demo omitidos (SEED_DEMO_USERS=false o NODE_ENV=production).');
    return;
  }

  for (const client of DEMO_CLIENTS) {
    await prisma.client.upsert({
      where: { id: client.id },
      update: { ...client, isActive: true },
      create: { ...client, isActive: true },
    });
  }

  for (const site of DEMO_SITES) {
    await prisma.site.upsert({
      where: { id: site.id },
      update: { ...site, isActive: true },
      create: { ...site, isActive: true },
    });
  }

  for (const equipment of DEMO_EQUIPMENT) {
    await prisma.equipment.upsert({
      where: { id: equipment.id },
      update: { ...equipment, isActive: true },
      create: { ...equipment, isActive: true },
    });
  }

  for (const project of DEMO_PROJECTS) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: project,
      create: project,
    });
  }

  for (const order of DEMO_SERVICE_ORDERS) {
    await prisma.serviceOrder.upsert({
      where: { id: order.id },
      update: order,
      create: order,
    });
  }

  console.log(
    `Datos comerciales demo listos: ${DEMO_CLIENTS.length} clientes, ${DEMO_SITES.length} sitios, ${DEMO_EQUIPMENT.length} equipos, ${DEMO_PROJECTS.length} proyectos y ${DEMO_SERVICE_ORDERS.length} ODS.`,
  );
}

type DemoInspectionSeed = {
  id: string;
  code: string;
  serviceOrderId: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'REJECTED';
  technicalDetails: string;
  daysAgo: number;
  approvedDaysAgo?: number;
  rejectionReason?: string;
};

const DEMO_INSPECTIONS: DemoInspectionSeed[] = [
  {
    id: 'insp-001',
    code: 'INS-2026-001',
    serviceOrderId: 'so-1915',
    status: 'APPROVED',
    technicalDetails:
      'Se detectó desgaste en la biela y una fisura superficial en el alojamiento. Calidad verificó la limpieza.',
    daysAgo: 14,
    approvedDaysAgo: 11,
  },
  {
    id: 'insp-002',
    code: 'INS-2026-002',
    serviceOrderId: 'so-1892',
    status: 'IN_PROGRESS',
    technicalDetails:
      'Inspección de limpieza y medición de excentricidad en curso.',
    daysAgo: 8,
  },
  {
    id: 'insp-003',
    code: 'INS-2026-003',
    serviceOrderId: 'so-1855',
    status: 'APPROVED',
    technicalDetails:
      'Babbitt con desgaste uniforme. Se aprueba rehabilitación por rebabitado y mecanizado.',
    daysAgo: 18,
    approvedDaysAgo: 15,
  },
  {
    id: 'insp-004',
    code: 'INS-2026-004',
    serviceOrderId: 'so-1901',
    status: 'APPROVED',
    technicalDetails:
      'Estator con polvo y humedad. Bobinas sin daño visible. Se aprueba limpieza, secado y pruebas.',
    daysAgo: 26,
    approvedDaysAgo: 23,
  },
  {
    id: 'insp-005',
    code: 'INS-2026-005',
    serviceOrderId: 'so-1850',
    status: 'REJECTED',
    technicalDetails:
      'Falta evidencia fotográfica de la limpieza abrasiva.',
    daysAgo: 10,
    rejectionReason:
      'Falta evidencia fotográfica de la limpieza. Repetir inspección.',
  },
  {
    id: 'insp-006',
    code: 'INS-2026-006',
    serviceOrderId: 'so-1888',
    status: 'APPROVED',
    technicalDetails:
      'Cámaras de combustión con desgaste leve. Se aprueba limpieza y verificación dimensional.',
    daysAgo: 20,
    approvedDaysAgo: 17,
  },
  {
    id: 'insp-007',
    code: 'INS-2026-007',
    serviceOrderId: 'so-1870',
    status: 'APPROVED',
    technicalDetails:
      'Rotor con desgaste en sellos. Se aprueba recuperación y balanceo.',
    daysAgo: 28,
    approvedDaysAgo: 25,
  },
  {
    id: 'insp-008',
    code: 'INS-2026-008',
    serviceOrderId: 'so-1802',
    status: 'APPROVED',
    technicalDetails:
      'Inspección de paso de gases calientes completada. Sin hallazgos críticos.',
    daysAgo: 58,
    approvedDaysAgo: 55,
  },
  {
    id: 'insp-009',
    code: 'INS-2026-009',
    serviceOrderId: 'so-1920',
    status: 'APPROVED',
    technicalDetails:
      'Bujes con desgaste dimensional. Se aprueba fabricación de reemplazo.',
    daysAgo: 5,
    approvedDaysAgo: 3,
  },
  {
    id: 'insp-010',
    code: 'INS-2026-010',
    serviceOrderId: 'so-1916',
    status: 'COMPLETED',
    technicalDetails:
      'Limpieza e inspección del rotor Elliott completadas. Se detectó desgaste leve en sellos. Pendiente aprobación de Taller.',
    daysAgo: 3,
  },
];

async function seedDemoInspections(
  jobPositionIds: Map<string, string>,
): Promise<void> {
  if (!shouldSeedDemoUsers()) {
    console.log('Inspecciones demo omitidas (SEED_DEMO_USERS=false o NODE_ENV=production).');
    return;
  }

  const equipmentTypeById = new Map(
    DEMO_EQUIPMENT.map((equipment) => [equipment.id, equipment.type]),
  );
  const equipmentNameById = new Map(
    DEMO_EQUIPMENT.map((equipment) => [equipment.id, equipment.name]),
  );
  let taskCount = 0;

  for (const inspection of DEMO_INSPECTIONS) {
    const order = DEMO_SERVICE_ORDERS.find(
      (item) => item.id === inspection.serviceOrderId,
    );

    if (!order) {
      throw new Error(`ODS no encontrada para la inspección ${inspection.id}`);
    }

    const equipmentType = equipmentTypeById.get(order.equipmentId);
    const equipmentName =
      equipmentNameById.get(order.equipmentId) ?? order.equipmentId;
    const primaryPositionCode =
      equipmentType === 'GENERATOR'
        ? 'WINDER_I'
        : equipmentType === 'AUXILIARY'
          ? 'MACHINE_OPERATOR_I'
          : 'ROTATING_SPECIALIST';
    const primaryPositionId = jobPositionIds.get(primaryPositionCode);
    const qualityPositionId = jobPositionIds.get('QUALITY_INSPECTOR');

    if (!primaryPositionId || !qualityPositionId) {
      throw new Error('Faltan puestos para sembrar las inspecciones demo');
    }

    const createdAt = shiftDays(-inspection.daysAgo);
    const approvedAt = inspection.approvedDaysAgo
      ? shiftDays(-inspection.approvedDaysAgo)
      : null;
    const allCompleted = ['APPROVED', 'COMPLETED'].includes(inspection.status);
    const firstStageStatus = 'COMPLETED' as const;
    const secondStageStatus = allCompleted ? ('COMPLETED' as const) : ('PENDING' as const);

    await prisma.inspection.upsert({
      where: { id: inspection.id },
      update: {
        code: inspection.code,
        serviceOrderId: inspection.serviceOrderId,
        technicalDetails: inspection.technicalDetails,
        status: inspection.status,
        createdById: 'u-workshop',
        approvedById: approvedAt ? 'u-workshop' : null,
        approvedAt,
        rejectionReason: inspection.rejectionReason ?? null,
        startedAt: createdAt,
        completedAt: allCompleted ? createdAt : null,
        createdAt,
        updatedAt: approvedAt ?? createdAt,
      },
      create: {
        id: inspection.id,
        code: inspection.code,
        serviceOrderId: inspection.serviceOrderId,
        technicalDetails: inspection.technicalDetails,
        status: inspection.status,
        createdById: 'u-workshop',
        approvedById: approvedAt ? 'u-workshop' : null,
        approvedAt,
        rejectionReason: inspection.rejectionReason ?? null,
        startedAt: createdAt,
        completedAt: allCompleted ? createdAt : null,
        createdAt,
        updatedAt: approvedAt ?? createdAt,
      },
    });

    const tasks = [
      {
        stage: 1,
        jobPositionId: primaryPositionId,
        description: `Inspección visual y dimensional del equipo ${equipmentName}.`,
        criteria: 'PR-TUR-100',
        formRef: 'FO-ING-110',
        status: firstStageStatus,
      },
      {
        stage: 1,
        jobPositionId: qualityPositionId,
        description: 'Inspección de limpieza y registro fotográfico.',
        criteria: 'PR-CAL-109',
        formRef: 'FO-ING-155',
        status: firstStageStatus,
      },
      {
        stage: 2,
        jobPositionId: primaryPositionId,
        description: 'Verificación dimensional y pruebas complementarias.',
        criteria: 'PR-TUR-120',
        formRef: 'FO-ING-120',
        status: secondStageStatus,
      },
      {
        stage: 2,
        jobPositionId: qualityPositionId,
        description: 'Liberación de calidad de la inspección.',
        criteria: 'PR-CAL-110',
        formRef: 'FO-ING-160',
        status: secondStageStatus,
      },
    ];

    for (const [index, task] of tasks.entries()) {
      const taskId = `${inspection.id}-task-${String(index + 1).padStart(2, '0')}`;
      const completed = task.status === 'COMPLETED';

      await prisma.task.upsert({
        where: { id: taskId },
        update: {
          inspectionId: inspection.id,
          jobPositionId: task.jobPositionId,
          assignedToId: null,
          createdById: 'u-workshop',
          sequence: (index + 1) * 10,
          stage: task.stage,
          source: 'INSPECTION',
          description: task.description,
          criteria: task.criteria,
          formRef: task.formRef,
          status: task.status,
          requiresEvidence: true,
          startedAt: completed ? createdAt : null,
          completedAt: completed ? createdAt : null,
          createdAt,
          updatedAt: createdAt,
        },
        create: {
          id: taskId,
          inspectionId: inspection.id,
          jobPositionId: task.jobPositionId,
          assignedToId: null,
          createdById: 'u-workshop',
          sequence: (index + 1) * 10,
          stage: task.stage,
          source: 'INSPECTION',
          description: task.description,
          criteria: task.criteria,
          formRef: task.formRef,
          status: task.status,
          requiresEvidence: true,
          startedAt: completed ? createdAt : null,
          completedAt: completed ? createdAt : null,
          createdAt,
          updatedAt: createdAt,
        },
      });
      taskCount += 1;
    }
  }

  console.log(
    `Inspecciones demo listas: ${DEMO_INSPECTIONS.length} inspecciones y ${taskCount} tareas.`,
  );
}

async function main(): Promise<void> {
  const jobPositionIds = await seedOrganization();
  const adminId = await seedAdmin();
  await seedDemoUsers(adminId, jobPositionIds);
  await seedDemoCommercial();
  await seedDemoInspections(jobPositionIds);
  console.log('Catálogos de organización, administrador y usuarios demo sembrados.');
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
