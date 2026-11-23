import { BadRequestException, Injectable } from '@nestjs/common';
import type { CreateSiteInput, SiteRecord, UpdateSiteInput } from '@turbopre/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

type SiteWithRelations = {
  id: string;
  clientId: string;
  name: string;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  client: { name: string };
  _count: { serviceOrders: number };
};

const SITE_INCLUDE = {
  client: { select: { name: true } },
  _count: { select: { serviceOrders: true } },
} as const;

@Injectable()
export class SitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: {
    clientId?: string;
    search?: string;
    includeInactive?: boolean;
  }): Promise<SiteRecord[]> {
    const term = query.search?.trim();
    const where: Prisma.SiteWhereInput = {
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(term
        ? {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { address: { contains: term, mode: 'insensitive' } },
              { client: { name: { contains: term, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const sites = await this.prisma.site.findMany({
      where,
      include: SITE_INCLUDE,
      orderBy: [{ client: { name: 'asc' } }, { name: 'asc' }],
    });

    return sites.map((site) => this.toRecord(site));
  }

  async create(input: CreateSiteInput, actorId: string): Promise<SiteRecord> {
    await this.ensureClient(input.clientId);

    const site = await this.prisma.site.create({
      data: input,
      include: SITE_INCLUDE,
    });

    await this.audit.record({
      userId: actorId,
      action: 'CREATE',
      entity: 'Site',
      entityId: site.id,
      changes: { after: { clientId: site.clientId, name: site.name } },
    });

    return this.toRecord(site);
  }

  async update(
    id: string,
    input: UpdateSiteInput,
    actorId: string,
  ): Promise<SiteRecord> {
    const site = await this.prisma.site.update({
      where: { id },
      data: input,
      include: SITE_INCLUDE,
    });

    await this.audit.record({
      userId: actorId,
      action: 'UPDATE',
      entity: 'Site',
      entityId: site.id,
      changes: { after: input },
    });

    return this.toRecord(site);
  }

  private async ensureClient(clientId: string): Promise<void> {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });

    if (!client || !client.isActive) {
      throw new BadRequestException('El cliente no existe o está inactivo');
    }
  }

  private toRecord(site: SiteWithRelations): SiteRecord {
    return {
      id: site.id,
      clientId: site.clientId,
      clientName: site.client.name,
      name: site.name,
      address: site.address,
      isActive: site.isActive,
      serviceOrderCount: site._count.serviceOrders,
      createdAt: site.createdAt.toISOString(),
      updatedAt: site.updatedAt.toISOString(),
    };
  }
}
