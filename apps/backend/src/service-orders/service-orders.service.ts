import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AuthUser,
  CreateServiceOrderInput,
  EquipmentType,
  InspectionStatus,
  Priority,
  RouteSheetStatus,
  ServiceOrderRecord,
  ServiceOrderStatus,
  UpdateServiceOrderInput,
} from '@turbopre/shared';
import {
  EQUIPMENT_TYPES,
  deriveServiceOrderWorkflowStatus,
  prioritySchema,
  serviceOrderStatusSchema,
} from '@turbopre/shared';
import { Prisma } from '../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import { parseNullableDate } from '../common/utils/date.js';
import { PrismaService } from '../prisma/prisma.service.js';

type ServiceOrderWithRelations = {
  id: string;
  orderNumber: string;
  parentServiceOrderId: string | null;
  projectId: string | null;
  clientId: string;
  siteId: string;
  equipmentId: string;
  createdById: string;
  description: string;
  scope: string;
  priority: Priority;
  status: ServiceOrderStatus;
  requestedAt: Date;
  dueAt: Date | null;
  deliveredAt: Date | null;
  closedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  client: { id: string; code: string | null; name: string };
  site: { id: string; name: string; address: string | null };
  equipment: {
    id: string;
    code: string;
    name: string;
    manufacturer: string | null;
    model: string | null;
    serialNumber: string | null;
    type: string | null;
  };
  createdBy: { id: string; fullName: string };
  project: { id: string; code: string; name: string } | null;
  parent: { orderNumber: string } | null;
  inspections: Array<{
    id: string;
    status: string;
    tasks: Array<{ status: string }>;
  }>;
  routeSheet: {
    id: string;
    status: string;
    tasks: Array<{ status: string }>;
  } | null;
};

const SERVICE_ORDER_INCLUDE = {
  client: { select: { id: true, code: true, name: true } },
  site: { select: { id: true, name: true, address: true } },
  equipment: {
    select: {
      id: true,
      code: true,
      name: true,
      manufacturer: true,
      model: true,
      serialNumber: true,
      type: true,
    },
  },
  createdBy: { select: { id: true, fullName: true } },
  project: { select: { id: true, code: true, name: true } },
  parent: { select: { orderNumber: true } },
  inspections: {
    select: {
      id: true,
      status: true,
      tasks: { select: { status: true } },
    },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
  routeSheet: {
    select: {
      id: true,
      status: true,
      tasks: { select: { status: true } },
    },
  },
} as const;

@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: {
    search?: string;
    status?: string;
    clientId?: string;
    priority?: string;
  }): Promise<ServiceOrderRecord[]> {
    const term = query.search?.trim();
    const status = query.status
      ? serviceOrderStatusSchema.safeParse(query.status)
      : undefined;
    const priority = query.priority
      ? prioritySchema.safeParse(query.priority)
      : undefined;

    const where: Prisma.ServiceOrderWhereInput = {
      ...(status?.success ? { status: status.data } : {}),
      ...(priority?.success ? { priority: priority.data } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(term
        ? {
            OR: [
              { orderNumber: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
              { scope: { contains: term, mode: 'insensitive' } },
              { client: { name: { contains: term, mode: 'insensitive' } } },
              { equipment: { code: { contains: term, mode: 'insensitive' } } },
              { equipment: { name: { contains: term, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const orders = await this.prisma.serviceOrder.findMany({
      where,
      include: SERVICE_ORDER_INCLUDE,
      orderBy: { requestedAt: 'desc' },
    });

    return orders.map((order) => this.toRecord(order));
  }

  async get(id: string): Promise<ServiceOrderRecord> {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: SERVICE_ORDER_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException('Orden de servicio no encontrada');
    }

    return this.toRecord(order);
  }

  async create(
    input: CreateServiceOrderInput,
    actor: AuthUser,
  ): Promise<ServiceOrderRecord> {
    await this.ensureClient(input.clientId);
    await this.ensureSite(input.siteId, input.clientId);
    await this.ensureEquipment(input.equipmentId, input.clientId);

    if (input.projectId) {
      await this.ensureProject(input.projectId);
    }

    if (input.parentServiceOrderId) {
      await this.ensureParent(input.parentServiceOrderId);
    }

    const data = {
      parentServiceOrderId: input.parentServiceOrderId ?? null,
      clientId: input.clientId,
      siteId: input.siteId,
      equipmentId: input.equipmentId,
      projectId: input.projectId ?? null,
      createdById: actor.id,
      description: input.description,
      scope: input.scope,
      priority: input.priority,
      status: 'OPEN' as const,
      dueAt: parseNullableDate(input.dueAt) ?? null,
      notes: input.notes ?? null,
    };

    let order: ServiceOrderWithRelations | undefined;

    for (let attempt = 0; attempt < 5 && !order; attempt += 1) {
      const orderNumber = await this.generateOrderNumber(input.parentServiceOrderId ?? null);

      try {
        order = await this.prisma.serviceOrder.create({
          data: { ...data, orderNumber },
          include: SERVICE_ORDER_INCLUDE,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt < 4
        ) {
          continue;
        }

        throw error;
      }
    }

    if (!order) {
      throw new BadRequestException('No se pudo generar la numeración de la ODS');
    }

    await this.audit.record({
      userId: actor.id,
      action: 'CREATE',
      entity: 'ServiceOrder',
      entityId: order.id,
      changes: {
        after: {
          orderNumber: order.orderNumber,
          clientId: order.clientId,
          equipmentId: order.equipmentId,
          priority: order.priority,
        },
      },
    });

    return this.toRecord(order);
  }

  async update(
    id: string,
    input: UpdateServiceOrderInput,
    actor: AuthUser,
  ): Promise<ServiceOrderRecord> {
    const current = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: SERVICE_ORDER_INCLUDE,
    });

    if (!current) {
      throw new NotFoundException('Orden de servicio no encontrada');
    }

    const hasWorkflow = current.inspections.length > 0 || current.routeSheet !== null;

    if ((hasWorkflow || current.status !== 'OPEN') && actor.role !== 'ADMIN') {
      throw new BadRequestException(
        'La ODS ya está en flujo; solo un administrador puede modificarla',
      );
    }

    if (input.siteId) {
      await this.ensureSite(input.siteId, current.clientId);
    }

    if (input.equipmentId) {
      await this.ensureEquipment(input.equipmentId, current.clientId);
    }

    if (input.projectId) {
      await this.ensureProject(input.projectId);
    }

    const order = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        ...(input.siteId !== undefined ? { siteId: input.siteId } : {}),
        ...(input.equipmentId !== undefined ? { equipmentId: input.equipmentId } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.scope !== undefined ? { scope: input.scope } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.dueAt !== undefined
          ? { dueAt: parseNullableDate(input.dueAt) ?? null }
          : {}),
        ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      include: SERVICE_ORDER_INCLUDE,
    });

    await this.audit.record({
      userId: actor.id,
      action: 'UPDATE',
      entity: 'ServiceOrder',
      entityId: order.id,
      changes: { after: input },
    });

    return this.toRecord(order);
  }

  async cancel(id: string, actor: AuthUser): Promise<ServiceOrderRecord> {
    const current = await this.prisma.serviceOrder.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException('Orden de servicio no encontrada');
    }

    if (['DELIVERED', 'CLOSED'].includes(current.status)) {
      throw new BadRequestException('Una ODS entregada o cerrada no se puede cancelar');
    }

    const order = await this.prisma.serviceOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: SERVICE_ORDER_INCLUDE,
    });

    await this.audit.record({
      userId: actor.id,
      action: 'STATUS_CHANGE',
      entity: 'ServiceOrder',
      entityId: order.id,
      changes: { from: current.status, to: 'CANCELLED' },
    });

    return this.toRecord(order);
  }

  async deliver(id: string, actor: AuthUser, notes?: string | null): Promise<ServiceOrderRecord> {
    const current = await this.prisma.serviceOrder.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException('Orden de servicio no encontrada');
    }

    if (current.status !== 'READY_FOR_DELIVERY') {
      throw new BadRequestException('La ODS todavía no está lista para entrega');
    }

    const order = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        ...(notes ? { notes: current.notes ? `${current.notes}\n${notes}` : notes } : {}),
      },
      include: SERVICE_ORDER_INCLUDE,
    });

    await this.audit.record({
      userId: actor.id,
      action: 'DELIVER',
      entity: 'ServiceOrder',
      entityId: order.id,
      changes: { from: current.status, to: 'DELIVERED' },
    });

    return this.toRecord(order);
  }

  private async generateOrderNumber(parentId: string | null): Promise<string> {
    const prefix = parentId ? '52-' : '51-';
    const rows = await this.prisma.serviceOrder.findMany({
      where: { orderNumber: { startsWith: prefix } },
      select: { orderNumber: true },
    });

    const highest = rows.reduce((max, row) => {
      const parsed = Number(row.orderNumber.slice(prefix.length));
      return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
    }, 0);

    return `${prefix}${String(highest + 1).padStart(4, '0')}`;
  }

  private async ensureClient(clientId: string): Promise<void> {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });

    if (!client || !client.isActive) {
      throw new BadRequestException('El cliente no existe o está inactivo');
    }
  }

  private async ensureSite(siteId: string, clientId: string): Promise<void> {
    const site = await this.prisma.site.findUnique({ where: { id: siteId } });

    if (!site || !site.isActive) {
      throw new BadRequestException('El sitio no existe o está inactivo');
    }

    if (site.clientId !== clientId) {
      throw new BadRequestException('El sitio seleccionado no pertenece al cliente');
    }
  }

  private async ensureEquipment(equipmentId: string, clientId: string): Promise<void> {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment || !equipment.isActive) {
      throw new BadRequestException('El equipo no existe o está inactivo');
    }

    if (equipment.clientId !== clientId) {
      throw new BadRequestException('El equipo seleccionado no pertenece al cliente');
    }
  }

  private async ensureProject(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new BadRequestException('El proyecto seleccionado no existe');
    }
  }

  private async ensureParent(parentId: string): Promise<void> {
    const parent = await this.prisma.serviceOrder.findUnique({ where: { id: parentId } });

    if (!parent) {
      throw new BadRequestException('La ODS principal no existe');
    }
  }

  private toType(value: string | null): EquipmentType {
    return value && EQUIPMENT_TYPES.includes(value as EquipmentType)
      ? (value as EquipmentType)
      : 'AUXILIARY';
  }

  private toRecord(order: ServiceOrderWithRelations): ServiceOrderRecord {
    const inspection = order.inspections[0];
    const tasks = order.routeSheet?.tasks.length
      ? order.routeSheet.tasks
      : inspection?.tasks ?? [];
    const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
    const progress =
      tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      parentServiceOrderId: order.parentServiceOrderId,
      parentOrderNumber: order.parent?.orderNumber ?? null,
      project: order.project,
      client: {
        id: order.client.id,
        code: order.client.code ?? '',
        name: order.client.name,
      },
      site: order.site,
      equipment: {
        ...order.equipment,
        type: this.toType(order.equipment.type),
      },
      createdBy: {
        id: order.createdBy.id,
        name: order.createdBy.fullName,
      },
      description: order.description,
      scope: order.scope,
      priority: order.priority,
      status: order.status,
      workflowStatus: deriveServiceOrderWorkflowStatus({
        status: order.status,
        inspectionStatus: inspection?.status as InspectionStatus | undefined,
        routeSheetStatus: order.routeSheet?.status as RouteSheetStatus | undefined,
      }),
      inspectionStatus: (inspection?.status as InspectionStatus | undefined) ?? null,
      requestedAt: order.requestedAt.toISOString(),
      dueAt: order.dueAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      closedAt: order.closedAt?.toISOString() ?? null,
      notes: order.notes,
      progress,
      inspectionId: inspection?.id ?? null,
      routeSheetId: order.routeSheet?.id ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
