import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const DEMO_EMAIL = 'admin@turbopre.dev';
const DEMO_PASSWORD = 'Admin123!';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL no está definida. Configúrala en apps/backend/.env antes de ejecutar el seed.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const password = await hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: 'Administrador', password, role: 'ADMIN' },
    create: { name: 'Administrador', email: DEMO_EMAIL, password, role: 'ADMIN' },
  });

  console.log(`Usuario semilla listo: ${user.email} / ${DEMO_PASSWORD}`);
}

await main();
await prisma.$disconnect();
