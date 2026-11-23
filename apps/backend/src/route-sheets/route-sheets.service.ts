import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AuthUser,
  CreateRouteSheetInput,
  CreateTaskInput,
  ReplaceRouteTasksInput,
  RouteSheetCommentInput,
  RouteSheetRecord,
  RouteSheetRejectInput,
  UpdateRouteSheetInput,
} from '@turbopre/shared';
import { routeSheetStatusSchema } from '@turbopre/shared';
import { Prisma } from '../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { validateTaskAssignment } from '../tasks/task-validation.js';
import {
  ROUTE_SHEET_INCLUDE,
  toRouteSheetRecord,
  type RouteSheetWithRelations,
} from './route-sheet-mapper.js';

@Injectable()
export class RouteSheetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: {
    search?: string;
    status?: string;
    serviceOrderId?: string;
  }): Promise<RouteSheetRecord[]> {
    const term = query.search?.trim();
    const status = query.status
      ? routeSheetStatusSchema.safeParse(query.status)
      : undefined;

    const where: Prisma.RouteSheetWhereInput = {
      ...(status?.success ? { status: status.data } : {}),
      ...(query.serviceOrderId ? { serviceOrderId: query.serviceOrderId } : {}),
      ...(term
        ? {
            OR: [
              { code: { contains: term, mode: 'insensitive' } },
              { serviceOrder: { orderNumber: { contains: term, mode: 'insensitive' } } },
              { serviceOrder: { client: { name: { contains: term, mode: 'insensitive' } } } },
              {
                serviceOrder: {
                  equipment: { code: { contains: term, mode: 'insensitive' } },
                },
              },
              {
                serviceOrder: {
                  equipment: { name: { contains: term, mode: 'insensitive' } },
                },
              },
            ],
          }
        : {}),
    };

    const routes = await this.prisma.routeSheet.findMany({
      where,
      include: ROUTE_SHEET_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return routes.map((route) => toRouteSheetRecord(route));
  }

  async get(id: string): Promise<RouteSheetRecord> {
    const route = await this.findIncluded(id);
    return toRouteSheetRecord(route);
  }

  async create(
    input: CreateRouteSheetInput,
    actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: input.inspectionId },
      include: {
        tasks: {
          select: { id: true, sequence: true, status: true },
          orderBy: { sequence: 'asc' },
        },
        serviceOrder: { select: { id: true, status: true } },
      },
    });

    if (!inspection) {
      throw new NotFoundException('Inspección de origen no encontrada');
    }

    if (inspection.status !== 'APPROVED') {
      throw new BadRequestException(
        'La hoja de ruta solo se crea desde una inspección aprobada',
      );
    }

    if (inspection.tasks.some((task) => task.status !== 'COMPLETED')) {
      throw new BadRequestException(
        'Todas las tareas de la inspección deben estar completadas',
      );
    }

    const existing = await this.prisma.routeSheet.findUnique({
      where: { serviceOrderId: inspection.serviceOrder.id },
      select: { code: true },
    });

    if (existing) {
      throw new BadRequestException(
        `La ODS ya tiene una hoja de ruta (${existing.code})`,
      );
    }

    for (const task of input.tasks) {
      await validateTaskAssignment(
        this.prisma,
        task.jobPositionId,
        task.assignedToId ?? null,
      );
    }

    const maxSequence = inspection.tasks.reduce(
      (max, task) => Math.max(max, task.sequence ?? 0),
      0,
    );
    let route: RouteSheetWithRelations | undefined;

    for (let attempt = 0; attempt < 5 && !route; attempt += 1) {
      const code = await this.generateCode();

      try {
        route = await this.prisma.$transaction(async (tx) => {
          const created = await tx.routeSheet.create({
            data: {
              code,
              serviceOrderId: inspection.serviceOrder.id,
              inspectionId: inspection.id,
              createdById: actor.id,
              status: 'DRAFT',
              notes: input.notes ?? null,
            },
            include: ROUTE_SHEET_INCLUDE,
          });

          // Los pasos ya realizados de la inspección se promueven a la hoja.
          await tx.task.updateMany({
            where: {
              inspectionId: inspection.id,
              routeSheetId: null,
            },
            data: { routeSheetId: created.id },
          });

          await tx.task.createMany({
            data: input.tasks.map((task, index) => ({
              routeSheetId: created.id,
              jobPositionId: task.jobPositionId,
              assignedToId: task.assignedToId ?? null,
              createdById: actor.id,
              sequence: maxSequence + (index + 1) * 10,
              stage: task.stage,
              source: 'ROUTE_SHEET',
              description: task.description,
              criteria: task.criteria ?? null,
              formRef: task.formRef ?? null,
              status: 'PENDING',
              requiresEvidence: task.requiresEvidence,
              estimatedMinutes: task.estimatedMinutes ?? null,
            })),
          });

          return created;
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

    if (!route) {
      throw new BadRequestException('No se pudo generar la hoja de ruta');
    }

    await this.audit.record({
      userId: actor.id,
      action: 'CREATE',
      entity: 'RouteSheet',
      entityId: route.id,
      changes: {
        after: {
          code: route.code,
          serviceOrderId: route.serviceOrderId,
          inspectionId: route.inspectionId,
        },
      },
    });

    return this.get(route.id);
  }

  async update(
    id: string,
    input: UpdateRouteSheetInput,
    actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    const route = await this.findIncluded(id);
    this.ensureStatus(route, ['DRAFT'], 'Solo se puede editar una hoja en borrador');

    await this.prisma.routeSheet.update({
      where: { id },
      data: input.notes !== undefined ? { notes: input.notes } : {},
    });

    await this.audit.record({
      userId: actor.id,
      action: 'UPDATE',
      entity: 'RouteSheet',
      entityId: id,
      changes: { after: input },
    });

    return this.get(id);
  }

  async replaceTasks(
    id: string,
    input: ReplaceRouteTasksInput,
    actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    const route = await this.findIncluded(id);
    this.ensureStatus(route, ['DRAFT'], 'Solo se pueden editar tareas en borrador');

    const routeTasks = route.tasks.filter((task) => task.source === 'ROUTE_SHEET');

    if (routeTasks.some((task) => task.status === 'COMPLETED')) {
      throw new BadRequestException('No se pueden eliminar tareas completadas');
    }

    for (const task of input.tasks) {
      await validateTaskAssignment(
        this.prisma,
        task.jobPositionId,
        task.assignedToId ?? null,
      );
    }

    const maxSequence = route.tasks.reduce(
      (max, task) => Math.max(max, task.sequence ?? 0),
      0,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({
        where: { routeSheetId: id, source: 'ROUTE_SHEET' },
      });

      await tx.task.createMany({
        data: input.tasks.map((task, index) => ({
          routeSheetId: id,
          jobPositionId: task.jobPositionId,
          assignedToId: task.assignedToId ?? null,
          createdById: actor.id,
          sequence: maxSequence + (index + 1) * 10,
          stage: task.stage,
          source: 'ROUTE_SHEET',
          description: task.description,
          criteria: task.criteria ?? null,
          formRef: task.formRef ?? null,
          status: 'PENDING',
          requiresEvidence: task.requiresEvidence,
          estimatedMinutes: task.estimatedMinutes ?? null,
        })),
      });
    });

    await this.audit.record({
      userId: actor.id,
      action: 'UPDATE',
      entity: 'RouteSheet',
      entityId: id,
      changes: { tasks: input.tasks.length },
    });

    return this.get(id);
  }

  async addTask(
    id: string,
    input: CreateTaskInput,
    actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    const route = await this.findIncluded(id);
    this.ensureStatus(
      route,
      ['DRAFT', 'IN_PROGRESS', 'PENDING_ANNEX_REVIEW', 'PENDING_QUALITY_APPROVAL'],
      'La hoja no admite tareas nuevas en su estado actual',
    );

    await validateTaskAssignment(
      this.prisma,
      input.jobPositionId,
      input.assignedToId ?? null,
    );

    const maxSequence = route.tasks.reduce(
      (max, task) => Math.max(max, task.sequence ?? 0),
      0,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.task.create({
        data: {
          routeSheetId: id,
          jobPositionId: input.jobPositionId,
          assignedToId: input.assignedToId ?? null,
          createdById: actor.id,
          sequence: maxSequence + 10,
          stage: input.stage,
          source: 'ROUTE_SHEET',
          description: input.description,
          criteria: input.criteria ?? null,
          formRef: input.formRef ?? null,
          status: 'PENDING',
          requiresEvidence: input.requiresEvidence,
          estimatedMinutes: input.estimatedMinutes ?? null,
        },
      });

      if (['PENDING_ANNEX_REVIEW', 'PENDING_QUALITY_APPROVAL'].includes(route.status)) {
        await tx.routeSheet.update({
          where: { id },
          data: { status: 'IN_PROGRESS', completedAt: null },
        });
      }
    });

    await this.audit.record({
      userId: actor.id,
      action: 'CREATE',
      entity: 'Task',
      entityId: id,
      changes: { after: { description: input.description, stage: input.stage } },
    });

    return this.get(id);
  }

  async submit(id: string, actor: AuthUser): Promise<RouteSheetRecord> {
    const route = await this.findIncluded(id);
    this.ensureStatus(route, ['DRAFT'], 'Solo una hoja en borrador se puede enviar');

    if (route.tasks.filter((task) => task.source === 'ROUTE_SHEET').length === 0) {
      throw new BadRequestException('Agrega al menos una tarea antes de enviar');
    }

    await this.prisma.routeSheet.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL' },
    });

    await this.audit.record({
      userId: actor.id,
      action: 'STATUS_CHANGE',
      entity: 'RouteSheet',
      entityId: id,
      changes: { from: route.status, to: 'PENDING_APPROVAL' },
    });

    return this.get(id);
  }

  async approve(
    id: string,
    input: RouteSheetCommentInput,
    actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    const route = await this.findIncluded(id);
    this.ensureStatus(
      route,
      ['PENDING_APPROVAL'],
      'La hoja no está pendiente de aprobación',
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.routeSheetReview.create({
        data: {
          routeSheetId: id,
          stage: 'MANAGER_APPROVAL',
          reviewerId: actor.id,
          decision: 'APPROVED',
          comments: input.comments ?? null,
        },
      });

      await tx.routeSheet.update({
        where: { id },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });
    });

    await this.audit.record({
      userId: actor.id,
      action: 'APPROVE',
      entity: 'RouteSheet',
      entityId: id,
      changes: { stage: 'MANAGER_APPROVAL' },
    });

    return this.get(id);
  }

  async reject(
    id: string,
    input: RouteSheetRejectInput,
    actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    const route = await this.findIncluded(id);
    this.ensureStatus(
      route,
      ['PENDING_APPROVAL'],
      'La hoja no está pendiente de aprobación',
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.routeSheetReview.create({
        data: {
          routeSheetId: id,
          stage: 'MANAGER_APPROVAL',
          reviewerId: actor.id,
          decision: 'REJECTED',
          comments: input.reason,
        },
      });

      await tx.routeSheet.update({
        where: { id },
        data: { status: 'DRAFT' },
      });
    });

    await this.audit.record({
      userId: actor.id,
      action: 'REJECT',
      entity: 'RouteSheet',
      entityId: id,
      changes: { stage: 'MANAGER_APPROVAL', reason: input.reason },
    });

    return this.get(id);
  }

  async finalizeAnnexes(
    id: string,
    input: RouteSheetCommentInput,
    actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    const route = await this.findIncluded(id);
    this.ensureStatus(
      route,
      ['PENDING_ANNEX_REVIEW'],
      'La hoja no está en revisión de anexos',
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.routeSheetReview.create({
        data: {
          routeSheetId: id,
          stage: 'ANNEX_REVIEW',
          reviewerId: actor.id,
          decision: 'APPROVED',
          comments: input.comments ?? null,
        },
      });

      await tx.routeSheet.update({
        where: { id },
        data: { status: 'PENDING_QUALITY_APPROVAL' },
      });
    });

    await this.audit.record({
      userId: actor.id,
      action: 'APPROVE',
      entity: 'RouteSheet',
      entityId: id,
      changes: { stage: 'ANNEX_REVIEW' },
    });

    return this.get(id);
  }

  async requestAnnexChanges(
    id: string,
    input: RouteSheetRejectInput,
    actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    const route = await this.findIncluded(id);
    this.ensureStatus(
      route,
      ['PENDING_ANNEX_REVIEW'],
      'La hoja no está en revisión de anexos',
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.routeSheetReview.create({
        data: {
          routeSheetId: id,
          stage: 'ANNEX_REVIEW',
          reviewerId: actor.id,
          decision: 'CHANGES_REQUESTED',
          comments: input.reason,
        },
      });

      await this.reopenLastStage(tx, id);

      await tx.routeSheet.update({
        where: { id },
        data: { status: 'IN_PROGRESS', completedAt: null },
      });
    });

    await this.audit.record({
      userId: actor.id,
      action: 'REJECT',
      entity: 'RouteSheet',
      entityId: id,
      changes: { stage: 'ANNEX_REVIEW', reason: input.reason },
    });

    return this.get(id);
  }

  async approveQuality(
    id: string,
    input: RouteSheetCommentInput,
    actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    const route = await this.findIncluded(id);
    this.ensureStatus(
      route,
      ['PENDING_QUALITY_APPROVAL'],
      'La hoja no está pendiente del visto bueno de Calidad',
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.routeSheetReview.create({
        data: {
          routeSheetId: id,
          stage: 'QUALITY_APPROVAL',
          reviewerId: actor.id,
          decision: 'APPROVED',
          comments: input.comments ?? null,
        },
      });

      await tx.routeSheet.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      if (
        route.serviceOrder.status !== 'DELIVERED' &&
        route.serviceOrder.status !== 'CLOSED' &&
        route.serviceOrder.status !== 'CANCELLED'
      ) {
        await tx.serviceOrder.update({
          where: { id: route.serviceOrder.id },
          data: { status: 'READY_FOR_DELIVERY' },
        });
      }
    });

    await this.audit.record({
      userId: actor.id,
      action: 'APPROVE',
      entity: 'RouteSheet',
      entityId: id,
      changes: { stage: 'QUALITY_APPROVAL' },
    });

    return this.get(id);
  }

  async rejectQuality(
    id: string,
    input: RouteSheetRejectInput,
    actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    const route = await this.findIncluded(id);
    this.ensureStatus(
      route,
      ['PENDING_QUALITY_APPROVAL'],
      'La hoja no está pendiente del visto bueno de Calidad',
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.routeSheetReview.create({
        data: {
          routeSheetId: id,
          stage: 'QUALITY_APPROVAL',
          reviewerId: actor.id,
          decision: 'REJECTED',
          comments: input.reason,
        },
      });

      await this.reopenLastStage(tx, id);

      await tx.routeSheet.update({
        where: { id },
        data: { status: 'IN_PROGRESS', completedAt: null },
      });
    });

    await this.audit.record({
      userId: actor.id,
      action: 'REJECT',
      entity: 'RouteSheet',
      entityId: id,
      changes: { stage: 'QUALITY_APPROVAL', reason: input.reason },
    });

    return this.get(id);
  }

  async toggleAnnex(
    id: string,
    taskId: string,
    selected: boolean,
    actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    const route = await this.findIncluded(id);
    this.ensureStatus(
      route,
      ['PENDING_ANNEX_REVIEW'],
      'Los anexos solo se editan durante su revisión',
    );

    const task = route.tasks.find((candidate) => candidate.id === taskId);

    if (!task) {
      throw new NotFoundException('Tarea de la hoja no encontrada');
    }

    const attachment = task.attachments[0];

    if (!attachment) {
      throw new BadRequestException('La tarea no tiene evidencia para anexar');
    }

    await this.prisma.taskAttachment.update({
      where: { id: attachment.id },
      data: {
        isSelectedForAnnex: selected,
        reviewedById: actor.id,
        reviewedAt: new Date(),
      },
    });

    await this.audit.record({
      userId: actor.id,
      action: 'UPDATE',
      entity: 'TaskAttachment',
      entityId: attachment.id,
      changes: { isSelectedForAnnex: selected },
    });

    return this.get(id);
  }

  private async findIncluded(id: string): Promise<RouteSheetWithRelations> {
    const route = await this.prisma.routeSheet.findUnique({
      where: { id },
      include: ROUTE_SHEET_INCLUDE,
    });

    if (!route) {
      throw new NotFoundException('Hoja de ruta no encontrada');
    }

    return route;
  }

  private ensureStatus(
    route: RouteSheetWithRelations,
    allowed: string[],
    message: string,
  ): void {
    if (!allowed.includes(route.status)) {
      throw new BadRequestException(message);
    }
  }

  private async reopenLastStage(
    tx: Prisma.TransactionClient,
    routeSheetId: string,
  ): Promise<void> {
    const last = await tx.task.findFirst({
      where: { routeSheetId, source: 'ROUTE_SHEET' },
      select: { stage: true },
      orderBy: { stage: 'desc' },
    });

    if (!last) return;

    await tx.task.updateMany({
      where: {
        routeSheetId,
        stage: last.stage,
        source: 'ROUTE_SHEET',
        status: 'COMPLETED',
      },
      data: { status: 'PENDING', completedAt: null },
    });
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `HR-${year}-`;
    const rows = await this.prisma.routeSheet.findMany({
      where: { code: { startsWith: prefix } },
      select: { code: true },
    });

    const highest = rows.reduce((max, row) => {
      const parsed = Number(row.code.slice(prefix.length));
      return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
    }, 0);

    return `${prefix}${String(highest + 1).padStart(3, '0')}`;
  }
}
