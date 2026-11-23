import { Injectable, Logger } from '@nestjs/common';
import type { AuditAction } from '@turbopre/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AuditRecordInput {
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  changes?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}

/**
 * Auditoría de solo escritura. Un fallo al auditar no debe tumbar la operación
 * de negocio: se registra en el log del servidor y se continúa.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditRecordInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: input.userId ?? null,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          changes: input.changes,
          ipAddress: input.ipAddress ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo registrar la auditoría de ${input.entity}/${input.entityId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
