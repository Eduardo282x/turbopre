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

type DemoRouteTaskSeed = {
  stage: number;
  sequence: number;
  positionCode: string;
  assignedToId: string;
  description: string;
  criteria?: string;
  formRef?: string;
  status: 'PENDING' | 'COMPLETED';
  completedDaysAgo?: number;
  evidence?: boolean;
  annexSelected?: boolean;
};

type DemoRouteReviewSeed = {
  stage: 'MANAGER_APPROVAL' | 'ANNEX_REVIEW' | 'QUALITY_APPROVAL';
  reviewerId: string;
  decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  comments?: string;
  daysAgo: number;
};

type DemoRouteSeed = {
  id: string;
  code: string;
  serviceOrderId: string;
  inspectionId: string;
  status:
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'RELEASED'
    | 'IN_PROGRESS'
    | 'PENDING_ANNEX_REVIEW'
    | 'PENDING_QUALITY_APPROVAL'
    | 'COMPLETED'
    | 'CANCELLED';
  createdById: string;
  createdDaysAgo: number;
  releasedDaysAgo?: number;
  completedDaysAgo?: number;
  notes: string;
  orderStatus: 'OPEN' | 'IN_PROGRESS' | 'READY_FOR_DELIVERY' | 'DELIVERED';
  deliveredDaysAgo?: number;
  reviews: DemoRouteReviewSeed[];
  tasks: DemoRouteTaskSeed[];
};

const DEMO_ROUTE_SHEETS: DemoRouteSeed[] = [
  {
    id: 'route-001',
    code: 'HR-2026-001',
    serviceOrderId: 'so-1915',
    inspectionId: 'insp-001',
    status: 'IN_PROGRESS',
    createdById: 'u-eng-1',
    createdDaysAgo: 11,
    releasedDaysAgo: 8,
    notes: 'Se debe registrar evidencia fotográfica de cada paso.',
    orderStatus: 'IN_PROGRESS',
    reviews: [
      {
        stage: 'MANAGER_APPROVAL',
        reviewerId: 'u-project',
        decision: 'APPROVED',
        comments: 'Plan de trabajo aprobado. Liberar a taller.',
        daysAgo: 8,
      },
    ],
    tasks: [
      {
        stage: 3,
        sequence: 60,
        positionCode: 'DRAWING_ENGINEER',
        assignedToId: 'u-eng-1',
        description: 'Elaborar plano de reparación de biela y alojamiento.',
        criteria: 'PR-ING-100',
        formRef: 'FO-ING-120',
        status: 'COMPLETED',
        completedDaysAgo: 7,
      },
      {
        stage: 3,
        sequence: 70,
        positionCode: 'QUALITY_INSPECTOR',
        assignedToId: 'u-quality-1',
        description: 'Revisar y aprobar plano de reparación.',
        criteria: 'PR-CAL-109',
        formRef: 'FO-ING-155',
        status: 'COMPLETED',
        completedDaysAgo: 6,
      },
      {
        stage: 4,
        sequence: 80,
        positionCode: 'MACHINE_OPERATOR_I',
        assignedToId: 'u-op-mach-1',
        description: 'Mecanizar superficie de biela según plano aprobado.',
        criteria: 'PR-TUR-100',
        status: 'COMPLETED',
        completedDaysAgo: 5,
        evidence: true,
        annexSelected: true,
      },
      {
        stage: 4,
        sequence: 90,
        positionCode: 'WELDER_I',
        assignedToId: 'u-op-weld-1',
        description: 'Reparar fisura por soldadura GTAW y verificar penetración.',
        criteria: 'PR-TUR-100',
        status: 'PENDING',
      },
      {
        stage: 4,
        sequence: 100,
        positionCode: 'QUALITY_INSPECTOR',
        assignedToId: 'u-quality-1',
        description: 'Realizar END con tintes penetrantes a la soldadura.',
        criteria: 'IN-CAL-102',
        formRef: 'FO-ING-110',
        status: 'PENDING',
      },
      {
        stage: 4,
        sequence: 105,
        positionCode: 'DRAWING_ENGINEER',
        assignedToId: 'u-eng-1',
        description: 'Revisar y firmar plano final de reparación.',
        criteria: 'PR-ING-101',
        formRef: 'FO-ING-121',
        status: 'PENDING',
      },
      {
        stage: 5,
        sequence: 110,
        positionCode: 'QUALITY_INSPECTOR',
        assignedToId: 'u-quality-1',
        description: 'Liberación final de calidad y verificación para despacho.',
        criteria: 'PR-CAL-109',
        formRef: 'FO-ING-184',
        status: 'PENDING',
      },
    ],
  },
  {
    id: 'route-002',
    code: 'HR-2026-002',
    serviceOrderId: 'so-1855',
    inspectionId: 'insp-003',
    status: 'PENDING_APPROVAL',
    createdById: 'u-eng-2',
    createdDaysAgo: 4,
    notes: 'Hoja basada en el procedimiento PR-TUR-100 y el formato real de hoja de ruta.',
    orderStatus: 'IN_PROGRESS',
    reviews: [],
    tasks: [
      {
        stage: 3,
        sequence: 50,
        positionCode: 'DEBURRER',
        assignedToId: 'u-op-mach-2',
        description: 'Efectuar la aplicación de estaño.',
        criteria: 'PR-TUR-100',
        status: 'PENDING',
      },
      {
        stage: 3,
        sequence: 60,
        positionCode: 'DEBURRER',
        assignedToId: 'u-op-mach-2',
        description: 'Efectuar precalentamiento sobre el material base.',
        criteria: 'PR-TUR-100',
        status: 'PENDING',
      },
      {
        stage: 3,
        sequence: 70,
        positionCode: 'DEBURRER',
        assignedToId: 'u-op-mach-2',
        description: 'Aplicar Babbitt de forma homogénea sobre el material base.',
        criteria: 'PR-TUR-100',
        status: 'PENDING',
      },
      {
        stage: 3,
        sequence: 80,
        positionCode: 'MACHINE_OPERATOR_I',
        assignedToId: 'u-op-mach-1',
        description: 'Mecanizar de forma manual el remanente de material de Babbitt.',
        criteria: 'PR-TUR-100',
        status: 'PENDING',
      },
      {
        stage: 3,
        sequence: 90,
        positionCode: 'QUALITY_INSPECTOR',
        assignedToId: 'u-quality-1',
        description: 'Realizar prueba de ultrasonido (proceso).',
        criteria: 'IN-CAL-115',
        formRef: 'FO-ING-111',
        status: 'PENDING',
      },
      {
        stage: 3,
        sequence: 100,
        positionCode: 'QUALITY_INSPECTOR',
        assignedToId: 'u-quality-1',
        description: 'Realizar END con tintes penetrantes coloreados (proceso).',
        criteria: 'IN-CAL-102',
        formRef: 'FO-ING-110',
        status: 'PENDING',
      },
      {
        stage: 3,
        sequence: 110,
        positionCode: 'MACHINE_OPERATOR_I',
        assignedToId: 'u-op-mach-1',
        description: 'Mecanizar hasta dimensiones finales requeridas.',
        criteria: 'PR-TUR-100',
        status: 'PENDING',
      },
      {
        stage: 3,
        sequence: 120,
        positionCode: 'QUALITY_INSPECTOR',
        assignedToId: 'u-quality-1',
        description: 'Realizar inspección dimensional final.',
        criteria: 'IN-CAL-132',
        formRef: 'FO-ING-157',
        status: 'PENDING',
      },
      {
        stage: 3,
        sequence: 130,
        positionCode: 'ROTATING_SPECIALIST',
        assignedToId: 'u-op-rot-1',
        description: 'Instalar RTD (4 por cojinete).',
        status: 'PENDING',
      },
      {
        stage: 3,
        sequence: 140,
        positionCode: 'QUALITY_INSPECTOR',
        assignedToId: 'u-quality-1',
        description: 'Realizar inspección visual final y registro fotográfico.',
        criteria: 'PR-CAL-109',
        formRef: 'FO-ING-155',
        status: 'PENDING',
      },
      {
        stage: 3,
        sequence: 150,
        positionCode: 'DEBURRER',
        assignedToId: 'u-op-mach-2',
        description: 'Aplicar pintura y protector anticorrosivo al componente.',
        criteria: 'PR-TUR-100',
        status: 'PENDING',
      },
    ],
  },
  {
    id: 'route-003',
    code: 'HR-2026-003',
    serviceOrderId: 'so-1901',
    inspectionId: 'insp-004',
    status: 'PENDING_ANNEX_REVIEW',
    createdById: 'u-eng-1',
    createdDaysAgo: 22,
    releasedDaysAgo: 19,
    notes: 'Todas las tareas completadas. Pendiente selección de anexos por Ingeniería.',
    orderStatus: 'IN_PROGRESS',
    reviews: [
      {
        stage: 'MANAGER_APPROVAL',
        reviewerId: 'u-project',
        decision: 'APPROVED',
        comments: 'Plan aprobado para mantenimiento mayor del generador.',
        daysAgo: 19,
      },
    ],
    tasks: [
      {
        stage: 3,
        sequence: 50,
        positionCode: 'WINDER_II',
        assignedToId: 'u-op-gen-1',
        description: 'Instalar bobinas y cuñas del estator.',
        criteria: 'PR-GEN-120',
        formRef: 'FO-ING-172',
        status: 'COMPLETED',
        completedDaysAgo: 8,
        evidence: true,
        annexSelected: true,
      },
      {
        stage: 3,
        sequence: 60,
        positionCode: 'QUALITY_INSPECTOR',
        assignedToId: 'u-quality-2',
        description: 'Prueba de resistencia de aislamiento final.',
        criteria: 'IN-CAL-115',
        formRef: 'FO-ING-111',
        status: 'COMPLETED',
        completedDaysAgo: 6,
        evidence: true,
        annexSelected: true,
      },
      {
        stage: 4,
        sequence: 70,
        positionCode: 'DRAWING_ENGINEER',
        assignedToId: 'u-eng-1',
        description: 'Elaborar informe de cierre y memoria técnica.',
        criteria: 'PR-ING-110',
        formRef: 'FO-ING-130',
        status: 'COMPLETED',
        completedDaysAgo: 3,
        evidence: true,
        annexSelected: false,
      },
      {
        stage: 4,
        sequence: 80,
        positionCode: 'QUALITY_INSPECTOR',
        assignedToId: 'u-quality-2',
        description: 'Revisión final de evidencias y anexos.',
        criteria: 'PR-CAL-109',
        formRef: 'FO-ING-155',
        status: 'COMPLETED',
        completedDaysAgo: 2,
        evidence: true,
        annexSelected: true,
      },
    ],
  },
  {
    id: 'route-004',
    code: 'HR-2026-004',
    serviceOrderId: 'so-1888',
    inspectionId: 'insp-006',
    status: 'PENDING_QUALITY_APPROVAL',
    createdById: 'u-eng-1',
    createdDaysAgo: 16,
    releasedDaysAgo: 13,
    notes: 'Anexos seleccionados. Pendiente visto bueno de Calidad.',
    orderStatus: 'IN_PROGRESS',
    reviews: [
      {
        stage: 'MANAGER_APPROVAL',
        reviewerId: 'u-project',
        decision: 'APPROVED',
        comments: 'Aprobado. Proceder con la inspección de combustión.',
        daysAgo: 13,
      },
      {
        stage: 'ANNEX_REVIEW',
        reviewerId: 'u-eng-1',
        decision: 'APPROVED',
        comments: 'Evidencias seleccionadas para el expediente.',
        daysAgo: 1,
      },
    ],
    tasks: [
      {
        stage: 2,
        sequence: 30,
        positionCode: 'MECHANIC_I',
        assignedToId: 'u-op-rot-2',
        description: 'Limpieza y verificación de cámaras de combustión.',
        criteria: 'PR-TUR-110',
        formRef: 'FO-ING-120',
        status: 'COMPLETED',
        completedDaysAgo: 8,
        evidence: true,
        annexSelected: true,
      },
      {
        stage: 2,
        sequence: 40,
        positionCode: 'QUALITY_INSPECTOR',
        assignedToId: 'u-quality-1',
        description: 'Verificación dimensional y liberación de componentes.',
        criteria: 'IN-CAL-132',
        formRef: 'FO-ING-157',
        status: 'COMPLETED',
        completedDaysAgo: 5,
        evidence: true,
        annexSelected: true,
      },
    ],
  },
  {
    id: 'route-005',
    code: 'HR-2026-005',
    serviceOrderId: 'so-1870',
    inspectionId: 'insp-007',
    status: 'COMPLETED',
    createdById: 'u-eng-2',
    createdDaysAgo: 24,
    releasedDaysAgo: 21,
    completedDaysAgo: 1,
    notes: 'Calidad aprobó la hoja. Pendiente confirmación de entrega por Ventas.',
    orderStatus: 'READY_FOR_DELIVERY',
    reviews: [
      {
        stage: 'MANAGER_APPROVAL',
        reviewerId: 'u-project',
        decision: 'APPROVED',
        comments: 'Aprobado para recuperación del rotor.',
        daysAgo: 21,
      },
      {
        stage: 'ANNEX_REVIEW',
        reviewerId: 'u-eng-2',
        decision: 'APPROVED',
        comments: 'Expediente de evidencias completo.',
        daysAgo: 3,
      },
      {
        stage: 'QUALITY_APPROVAL',
        reviewerId: 'u-quality-1',
        decision: 'APPROVED',
        comments: 'Liberado por Calidad. Listo para entrega.',
        daysAgo: 1,
      },
    ],
    tasks: [
      {
        stage: 2,
        sequence: 30,
        positionCode: 'MACHINE_OPERATOR_II',
        assignedToId: 'u-op-mach-1',
        description: 'Recuperar sellos y mecanizar superficies de apoyo.',
        criteria: 'PR-MEC-100',
        formRef: 'FO-ING-157',
        status: 'COMPLETED',
        completedDaysAgo: 12,
        evidence: true,
        annexSelected: true,
      },
      {
        stage: 2,
        sequence: 40,
        positionCode: 'ROTATING_SPECIALIST',
        assignedToId: 'u-op-rot-1',
        description: 'Balanceo dinámico del rotor y verificación final.',
        criteria: 'IN-CAL-120',
        formRef: 'FO-ING-160',
        status: 'COMPLETED',
        completedDaysAgo: 8,
        evidence: true,
        annexSelected: true,
      },
    ],
  },
  {
    id: 'route-006',
    code: 'HR-2026-006',
    serviceOrderId: 'so-1802',
    inspectionId: 'insp-008',
    status: 'COMPLETED',
    createdById: 'u-eng-1',
    createdDaysAgo: 54,
    releasedDaysAgo: 51,
    completedDaysAgo: 10,
    notes: 'Expediente entregado y archivado.',
    orderStatus: 'DELIVERED',
    deliveredDaysAgo: 9,
    reviews: [
      {
        stage: 'MANAGER_APPROVAL',
        reviewerId: 'u-project',
        decision: 'APPROVED',
        comments: 'Aprobado el mantenimiento mayor.',
        daysAgo: 51,
      },
      {
        stage: 'ANNEX_REVIEW',
        reviewerId: 'u-eng-1',
        decision: 'APPROVED',
        comments: 'Anexos revisados y seleccionados.',
        daysAgo: 12,
      },
      {
        stage: 'QUALITY_APPROVAL',
        reviewerId: 'u-quality-2',
        decision: 'APPROVED',
        comments: 'Calidad libera el expediente.',
        daysAgo: 10,
      },
    ],
    tasks: [
      {
        stage: 2,
        sequence: 30,
        positionCode: 'WELDER_FI',
        assignedToId: 'u-op-weld-2',
        description: 'Reparación de componentes de combustión por soldadura especial.',
        criteria: 'PR-SOL-100',
        formRef: 'FO-ING-140',
        status: 'COMPLETED',
        completedDaysAgo: 25,
        evidence: true,
        annexSelected: true,
      },
      {
        stage: 2,
        sequence: 40,
        positionCode: 'QUALITY_INSPECTOR',
        assignedToId: 'u-quality-2',
        description: 'Inspección final y liberación de componentes.',
        criteria: 'PR-CAL-109',
        formRef: 'FO-ING-155',
        status: 'COMPLETED',
        completedDaysAgo: 20,
        evidence: true,
        annexSelected: true,
      },
    ],
  },
];

function demoEvidenceUrl(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#e2e8f0"/><rect x="24" y="24" width="592" height="312" fill="none" stroke="#94a3b8" stroke-width="4" stroke-dasharray="12 8"/><text x="320" y="168" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#334155">EVIDENCIA FOTOGRÁFICA</text><text x="320" y="210" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#475569">${label}</text><text x="320" y="246" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">TurboPre Services · CAMI</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function demoDocumentUrl(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#f8fafc"/><rect x="24" y="24" width="592" height="312" fill="none" stroke="#0ea5e9" stroke-width="4"/><text x="320" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">DOCUMENTO DE HOJA DE RUTA</text><text x="320" y="192" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#334155">${label}</text><text x="320" y="234" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">TurboPre Services · Ingeniería</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const DEMO_ROUTE_DOCUMENTS = [
  {
    id: 'route-001-doc-01',
    routeSheetId: 'route-001',
    label: 'Plano de reparación de biela y alojamiento',
    type: 'PLAN' as const,
    uploadedById: 'u-eng-1',
    daysAgo: 10,
  },
  {
    id: 'route-003-doc-01',
    routeSheetId: 'route-003',
    label: 'Informe de cierre del generador GE 7FH2',
    type: 'PDF' as const,
    uploadedById: 'u-eng-1',
    daysAgo: 4,
  },
  {
    id: 'route-005-doc-01',
    routeSheetId: 'route-005',
    label: 'Certificado de balanceo del rotor GE ST-300',
    type: 'CERTIFICATE' as const,
    uploadedById: 'u-eng-2',
    daysAgo: 6,
  },
];

async function seedDemoRoutes(
  jobPositionIds: Map<string, string>,
): Promise<void> {
  if (!shouldSeedDemoUsers()) {
    console.log('Hojas de ruta demo omitidas (SEED_DEMO_USERS=false o NODE_ENV=production).');
    return;
  }

  let taskCount = 0;
  let reviewCount = 0;
  let evidenceCount = 0;
  let documentCount = 0;

  for (const route of DEMO_ROUTE_SHEETS) {
    const createdAt = shiftDays(-route.createdDaysAgo);
    const releasedAt =
      route.releasedDaysAgo !== undefined ? shiftDays(-route.releasedDaysAgo) : null;
    const completedAt =
      route.completedDaysAgo !== undefined ? shiftDays(-route.completedDaysAgo) : null;
    const updatedAt = completedAt ?? releasedAt ?? createdAt;

    await prisma.routeSheet.upsert({
      where: { id: route.id },
      update: {
        code: route.code,
        serviceOrderId: route.serviceOrderId,
        inspectionId: route.inspectionId,
        createdById: route.createdById,
        status: route.status,
        releasedAt,
        completedAt,
        notes: route.notes,
        createdAt,
        updatedAt,
      },
      create: {
        id: route.id,
        code: route.code,
        serviceOrderId: route.serviceOrderId,
        inspectionId: route.inspectionId,
        createdById: route.createdById,
        status: route.status,
        releasedAt,
        completedAt,
        notes: route.notes,
        createdAt,
        updatedAt,
      },
    });

    // Las tareas ya realizadas en la inspección se conservan como parte de la hoja.
    await prisma.task.updateMany({
      where: { inspectionId: route.inspectionId, routeSheetId: null },
      data: { routeSheetId: route.id },
    });

    for (const [index, task] of route.tasks.entries()) {
      const jobPositionId = jobPositionIds.get(task.positionCode);

      if (!jobPositionId) {
        throw new Error(
          `Puesto ${task.positionCode} no encontrado para la hoja ${route.id}`,
        );
      }

      const taskId = `${route.id}-task-${String(index + 1).padStart(2, '0')}`;
      const taskCreatedAt =
        task.completedDaysAgo !== undefined
          ? shiftDays(-task.completedDaysAgo)
          : createdAt;
      const taskCompletedAt =
        task.completedDaysAgo !== undefined
          ? shiftDays(-task.completedDaysAgo)
          : null;

      await prisma.task.upsert({
        where: { id: taskId },
        update: {
          inspectionId: null,
          routeSheetId: route.id,
          jobPositionId,
          assignedToId: task.assignedToId,
          createdById: route.createdById,
          sequence: task.sequence,
          stage: task.stage,
          source: 'ROUTE_SHEET',
          description: task.description,
          criteria: task.criteria ?? null,
          formRef: task.formRef ?? null,
          status: task.status,
          requiresEvidence: true,
          startedAt: taskCompletedAt,
          completedAt: taskCompletedAt,
          createdAt: taskCreatedAt,
          updatedAt: taskCompletedAt ?? taskCreatedAt,
        },
        create: {
          id: taskId,
          inspectionId: null,
          routeSheetId: route.id,
          jobPositionId,
          assignedToId: task.assignedToId,
          createdById: route.createdById,
          sequence: task.sequence,
          stage: task.stage,
          source: 'ROUTE_SHEET',
          description: task.description,
          criteria: task.criteria ?? null,
          formRef: task.formRef ?? null,
          status: task.status,
          requiresEvidence: true,
          startedAt: taskCompletedAt,
          completedAt: taskCompletedAt,
          createdAt: taskCreatedAt,
          updatedAt: taskCompletedAt ?? taskCreatedAt,
        },
      });
      taskCount += 1;

      if (task.evidence) {
        const attachmentId = `${taskId}-evidence`;
        const attachmentCreatedAt = taskCompletedAt ?? taskCreatedAt;

        await prisma.taskAttachment.upsert({
          where: { id: attachmentId },
          update: {
            taskId,
            url: demoEvidenceUrl(`${route.code} · ${task.description}`),
            type: 'PHOTO',
            uploadedById: task.assignedToId,
            isSelectedForAnnex: task.annexSelected ?? null,
            reviewedById: task.annexSelected !== undefined ? route.createdById : null,
            reviewedAt:
              task.annexSelected !== undefined ? attachmentCreatedAt : null,
            createdAt: attachmentCreatedAt,
          },
          create: {
            id: attachmentId,
            taskId,
            url: demoEvidenceUrl(`${route.code} · ${task.description}`),
            type: 'PHOTO',
            uploadedById: task.assignedToId,
            isSelectedForAnnex: task.annexSelected ?? null,
            reviewedById: task.annexSelected !== undefined ? route.createdById : null,
            reviewedAt:
              task.annexSelected !== undefined ? attachmentCreatedAt : null,
            createdAt: attachmentCreatedAt,
          },
        });
        evidenceCount += 1;
      }
    }

    for (const [index, review] of route.reviews.entries()) {
      const reviewId = `${route.id}-review-${String(index + 1).padStart(2, '0')}`;

      await prisma.routeSheetReview.upsert({
        where: { id: reviewId },
        update: {
          routeSheetId: route.id,
          stage: review.stage,
          reviewerId: review.reviewerId,
          decision: review.decision,
          comments: review.comments ?? null,
          createdAt: shiftDays(-review.daysAgo),
        },
        create: {
          id: reviewId,
          routeSheetId: route.id,
          stage: review.stage,
          reviewerId: review.reviewerId,
          decision: review.decision,
          comments: review.comments ?? null,
          createdAt: shiftDays(-review.daysAgo),
        },
      });
      reviewCount += 1;
    }
  }

  for (const document of DEMO_ROUTE_DOCUMENTS) {
    const createdAt = shiftDays(-document.daysAgo);
    const data = {
      routeSheetId: document.routeSheetId,
      url: demoDocumentUrl(document.label),
      type: document.type,
      uploadedById: document.uploadedById,
      createdAt,
    };

    await prisma.routeSheetDocument.upsert({
      where: { id: document.id },
      update: data,
      create: { id: document.id, ...data },
    });
    documentCount += 1;
  }

  for (const route of DEMO_ROUTE_SHEETS) {
    await prisma.serviceOrder.update({
      where: { id: route.serviceOrderId },
      data: {
        status: route.orderStatus,
        ...(route.deliveredDaysAgo !== undefined
          ? { deliveredAt: shiftDays(-route.deliveredDaysAgo) }
          : {}),
      },
    });
  }

  console.log(
    `Hojas de ruta demo listas: ${DEMO_ROUTE_SHEETS.length} hojas, ${taskCount} tareas, ${reviewCount} revisiones, ${evidenceCount} evidencias y ${documentCount} documentos.`,
  );
}

async function main(): Promise<void> {
  const jobPositionIds = await seedOrganization();
  const adminId = await seedAdmin();
  await seedDemoUsers(adminId, jobPositionIds);
  await seedDemoCommercial();
  await seedDemoInspections(jobPositionIds);
  await seedDemoRoutes(jobPositionIds);
  console.log('Catálogos de organización, administrador y usuarios demo sembrados.');
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
