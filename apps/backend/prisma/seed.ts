import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@turbopre.dev';
const ADMIN_PASSWORD = 'admin';
const ADMIN_NAME = 'Administrador';

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
  // Ingeniería y Soporte Técnico (posiciones iniciales, editables por el administrador)
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

async function seedOrganization(): Promise<void> {
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

  for (const position of JOB_POSITIONS) {
    const processId = processIds.get(position.processCode);

    if (!processId) {
      throw new Error(`Proceso no encontrado: ${position.processCode}`);
    }

    await prisma.jobPosition.upsert({
      where: { code: position.code },
      update: { name: position.name, processId, isActive: true },
      create: {
        code: position.code,
        name: position.name,
        processId,
      },
    });
  }
}

async function seedAdmin(): Promise<void> {
  const passwordHash = await hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {
      email: ADMIN_EMAIL,
      passwordHash,
      fullName: ADMIN_NAME,
      role: 'ADMIN',
      isActive: true,
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
}

async function main(): Promise<void> {
  await seedOrganization();
  await seedAdmin();
  console.log('Catálogos de organización y usuario administrador sembrados.');
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
