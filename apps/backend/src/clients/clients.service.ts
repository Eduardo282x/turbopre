import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ClientRecord,
  CreateClientInput,
  UpdateClientInput,
} from '@turbopre/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

type ClientWithCounts = {
  id: string;
  code: string | null;
  name: string;
  taxId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    sites: number;
    equipment: number;
    serviceOrders: number;
  };
  serviceOrders: Array<{ id: string }>;
};

const CLIENT_INCLUDE = {
  _count: {
    select: {
      sites: true,
      equipment: true,
      serviceOrders: true,
    },
  },
  serviceOrders: {
    where: {
      status: {
        notIn: ['DELIVERED', 'CLOSED', 'CANCELLED'],
      },
    },
    select: { id: true },
  },
} satisfies Prisma.ClientInclude;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: {
    search?: string;
    includeInactive?: boolean;
  }): Promise<ClientRecord[]> {
    const term = query.search?.trim();
    const where: Prisma.ClientWhereInput = {
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(term
        ? {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { code: { contains: term, mode: 'insensitive' } },
              { contactName: { contains: term, mode: 'insensitive' } },
              { contactEmail: { contains: term, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const clients = await this.prisma.client.findMany({
      where,
      include: CLIENT_INCLUDE,
      orderBy: { name: 'asc' },
    });

    return clients.map((client) => this.toRecord(client));
  }

  async get(id: string): Promise<ClientRecord> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: CLIENT_INCLUDE,
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return this.toRecord(client);
  }

  async create(input: CreateClientInput, actorId: string): Promise<ClientRecord> {
    const client = await this.prisma.client.create({
      data: input,
      include: CLIENT_INCLUDE,
    });

    await this.audit.record({
      userId: actorId,
      action: 'CREATE',
      entity: 'Client',
      entityId: client.id,
      changes: { after: { code: client.code, name: client.name } },
    });

    return this.toRecord(client);
  }

  async update(
    id: string,
    input: UpdateClientInput,
    actorId: string,
  ): Promise<ClientRecord> {
    const client = await this.prisma.client.update({
      where: { id },
      data: input,
      include: CLIENT_INCLUDE,
    });

    await this.audit.record({
      userId: actorId,
      action: 'UPDATE',
      entity: 'Client',
      entityId: client.id,
      changes: { after: input },
    });

    return this.toRecord(client);
  }

  private toRecord(client: ClientWithCounts): ClientRecord {
    return {
      id: client.id,
      code: client.code ?? '',
      name: client.name,
      taxId: client.taxId,
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      address: client.address,
      isActive: client.isActive,
      siteCount: client._count.sites,
      equipmentCount: client._count.equipment,
      serviceOrderCount: client._count.serviceOrders,
      activeServiceOrderCount: client.serviceOrders.length,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }
}
