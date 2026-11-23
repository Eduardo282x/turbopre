import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  CreateEquipmentInput,
  EquipmentRecord,
  EquipmentType,
  UpdateEquipmentInput,
} from '@turbopre/shared';
import { EQUIPMENT_TYPES } from '@turbopre/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

type EquipmentWithRelations = {
  id: string;
  clientId: string;
  code: string;
  name: string;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  type: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  client: { name: string };
  _count: { serviceOrders: number };
};

const EQUIPMENT_INCLUDE = {
  client: { select: { name: true } },
  _count: { select: { serviceOrders: true } },
} as const;

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: {
    clientId?: string;
    search?: string;
    includeInactive?: boolean;
  }): Promise<EquipmentRecord[]> {
    const term = query.search?.trim();
    const where: Prisma.EquipmentWhereInput = {
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(term
        ? {
            OR: [
              { code: { contains: term, mode: 'insensitive' } },
              { name: { contains: term, mode: 'insensitive' } },
              { manufacturer: { contains: term, mode: 'insensitive' } },
              { model: { contains: term, mode: 'insensitive' } },
              { serialNumber: { contains: term, mode: 'insensitive' } },
              { client: { name: { contains: term, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const equipment = await this.prisma.equipment.findMany({
      where,
      include: EQUIPMENT_INCLUDE,
      orderBy: [{ client: { name: 'asc' } }, { code: 'asc' }],
    });

    return equipment.map((item) => this.toRecord(item));
  }

  async create(
    input: CreateEquipmentInput,
    actorId: string,
  ): Promise<EquipmentRecord> {
    await this.ensureClient(input.clientId);

    const equipment = await this.prisma.equipment.create({
      data: input,
      include: EQUIPMENT_INCLUDE,
    });

    await this.audit.record({
      userId: actorId,
      action: 'CREATE',
      entity: 'Equipment',
      entityId: equipment.id,
      changes: {
        after: { clientId: equipment.clientId, code: equipment.code, name: equipment.name },
      },
    });

    return this.toRecord(equipment);
  }

  async update(
    id: string,
    input: UpdateEquipmentInput,
    actorId: string,
  ): Promise<EquipmentRecord> {
    const equipment = await this.prisma.equipment.update({
      where: { id },
      data: input,
      include: EQUIPMENT_INCLUDE,
    });

    await this.audit.record({
      userId: actorId,
      action: 'UPDATE',
      entity: 'Equipment',
      entityId: equipment.id,
      changes: { after: input },
    });

    return this.toRecord(equipment);
  }

  private async ensureClient(clientId: string): Promise<void> {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });

    if (!client || !client.isActive) {
      throw new BadRequestException('El cliente no existe o está inactivo');
    }
  }

  private toType(value: string | null): EquipmentType {
    return value && EQUIPMENT_TYPES.includes(value as EquipmentType)
      ? (value as EquipmentType)
      : 'AUXILIARY';
  }

  private toRecord(equipment: EquipmentWithRelations): EquipmentRecord {
    return {
      id: equipment.id,
      clientId: equipment.clientId,
      clientName: equipment.client.name,
      code: equipment.code,
      name: equipment.name,
      serialNumber: equipment.serialNumber,
      manufacturer: equipment.manufacturer,
      model: equipment.model,
      type: this.toType(equipment.type),
      notes: equipment.notes,
      isActive: equipment.isActive,
      serviceOrderCount: equipment._count.serviceOrders,
      createdAt: equipment.createdAt.toISOString(),
      updatedAt: equipment.updatedAt.toISOString(),
    };
  }
}
