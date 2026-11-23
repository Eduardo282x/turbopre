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

async function main(): Promise<void> {
  const jobPositionIds = await seedOrganization();
  const adminId = await seedAdmin();
  await seedDemoUsers(adminId, jobPositionIds);
  console.log('Catálogos de organización, administrador y usuarios demo sembrados.');
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
