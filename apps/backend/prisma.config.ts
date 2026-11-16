import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Configuración del CLI de Prisma (ORM v7).
 *
 * La conexión se lee de DATABASE_URL; mientras no exista, los comandos que no
 * tocan la base de datos (`prisma generate`) siguen funcionando.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
