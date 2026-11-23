import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  CreateProjectInput,
  ProjectRecord,
  ProjectStatus,
  UpdateProjectInput,
} from '@turbopre/shared';
import { projectStatusSchema } from '@turbopre/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import { parseNullableDate } from '../common/utils/date.js';
import { PrismaService } from '../prisma/prisma.service.js';

type ProjectWithRelations = {
  id: string;
  code: string;
  name: string;
  clientId: string | null;
  managerId: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  dueDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  client: { name: string } | null;
  manager: { fullName: string } | null;
  serviceOrders: Array<{ status: string }>;
};

const PROJECT_INCLUDE = {
  client: { select: { name: true } },
  manager: { select: { fullName: true } },
  serviceOrders: { select: { status: true } },
} as const;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: {
    search?: string;
    status?: string;
    clientId?: string;
  }): Promise<ProjectRecord[]> {
    const term = query.search?.trim();
    const status = query.status ? projectStatusSchema.safeParse(query.status) : undefined;
    const where: Prisma.ProjectWhereInput = {
      ...(status?.success ? { status: status.data } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(term
        ? {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { code: { contains: term, mode: 'insensitive' } },
              { client: { name: { contains: term, mode: 'insensitive' } } },
              { manager: { fullName: { contains: term, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const projects = await this.prisma.project.findMany({
      where,
      include: PROJECT_INCLUDE,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return projects.map((project) => this.toRecord(project));
  }

  async create(input: CreateProjectInput, actorId: string): Promise<ProjectRecord> {
    await this.ensureRelations(input.clientId, input.managerId);

    const code = input.code ?? `PRY-${String((await this.prisma.project.count()) + 1).padStart(3, '0')}`;

    const project = await this.prisma.project.create({
      data: {
        code,
        name: input.name,
        clientId: input.clientId ?? null,
        managerId: input.managerId ?? null,
        status: input.status,
        startDate: parseNullableDate(input.startDate) ?? null,
        dueDate: parseNullableDate(input.dueDate) ?? null,
        notes: input.notes ?? null,
      },
      include: PROJECT_INCLUDE,
    });

    await this.audit.record({
      userId: actorId,
      action: 'CREATE',
      entity: 'Project',
      entityId: project.id,
      changes: { after: { code: project.code, name: project.name, status: project.status } },
    });

    return this.toRecord(project);
  }

  async update(
    id: string,
    input: UpdateProjectInput,
    actorId: string,
  ): Promise<ProjectRecord> {
    await this.ensureRelations(input.clientId, input.managerId);

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
        ...(input.managerId !== undefined ? { managerId: input.managerId } : {}),
        ...(input.startDate !== undefined
          ? { startDate: parseNullableDate(input.startDate) ?? null }
          : {}),
        ...(input.dueDate !== undefined
          ? { dueDate: parseNullableDate(input.dueDate) ?? null }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      include: PROJECT_INCLUDE,
    });

    await this.audit.record({
      userId: actorId,
      action: 'UPDATE',
      entity: 'Project',
      entityId: project.id,
      changes: { after: input },
    });

    return this.toRecord(project);
  }

  private async ensureRelations(
    clientId?: string | null,
    managerId?: string | null,
  ): Promise<void> {
    if (clientId) {
      const client = await this.prisma.client.findUnique({ where: { id: clientId } });
      if (!client || !client.isActive) {
        throw new BadRequestException('El cliente del proyecto no existe o está inactivo');
      }
    }

    if (managerId) {
      const manager = await this.prisma.user.findUnique({ where: { id: managerId } });
      if (!manager || !manager.isActive) {
        throw new BadRequestException('El responsable del proyecto no existe o está inactivo');
      }
    }
  }

  private toRecord(project: ProjectWithRelations): ProjectRecord {
    const activeOrders = project.serviceOrders.filter(
      (order) => order.status !== 'CANCELLED',
    );
    const completedOrders = activeOrders.filter((order) =>
      ['DELIVERED', 'CLOSED'].includes(order.status),
    ).length;
    const progress =
      activeOrders.length === 0
        ? 0
        : Math.round((completedOrders / activeOrders.length) * 100);

    return {
      id: project.id,
      code: project.code,
      name: project.name,
      clientId: project.clientId,
      clientName: project.client?.name ?? null,
      managerId: project.managerId,
      managerName: project.manager?.fullName ?? null,
      status: project.status,
      startDate: project.startDate?.toISOString() ?? null,
      dueDate: project.dueDate?.toISOString() ?? null,
      notes: project.notes,
      progress,
      serviceOrderCount: project.serviceOrders.length,
      completedServiceOrderCount: completedOrders,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
