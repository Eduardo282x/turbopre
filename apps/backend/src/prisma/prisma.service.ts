import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Cliente Prisma con inicialización perezosa: la aplicación arranca aunque la
 * base de datos todavía no esté configurada (modo demo del login).
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private client: PrismaClient | null = null;

  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return Boolean(this.config.get<string>('DATABASE_URL'));
  }

  get db(): PrismaClient {
    if (!this.client) {
      const connectionString = this.config.get<string>('DATABASE_URL');

      if (!connectionString) {
        throw new Error(
          'DATABASE_URL no está configurada. Copia apps/backend/.env.example a .env y define la conexión a PostgreSQL.',
        );
      }

      this.client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
      this.logger.log('Cliente Prisma inicializado');
    }

    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.$disconnect();
      this.client = null;
    }
  }
}
