import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AuthUser,
  CreateInspectionInput,
  CreateTaskInput,
  InspectionRecord,
  RejectInspectionInput,
  UpdateInspectionInput,
  UpdateTaskInput,
} from '@turbopre/shared';
import { Prisma } from '../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  INSPECTION_INCLUDE,
  toInspectionRecord,
  type InspectionWithRelations,
} from './inspection-mapper.js';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: {
    search?: string;
    status?: string;
    serviceOrderId?: string;
  }): Promise<InspectionRecord[]> {
    const term = query.search?.trim();
    const where: Prisma.InspectionWhereInput = {
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.serviceOrderId ? { serviceOrderId: query.serviceOrderId } : {}),
      ...(term
        ? {
            OR: [
              { code: { contains: term, mode: 'insensitive' } },
              { serviceOrder: { orderNumber: { contains: term, mode: 'insensitive' } } },
              { serviceOrder: { client: { name: { contains: term, mode: 'insensitive' } } } },
              { serviceOrder: { equipment: { code: { contains: term, mode: 'insensitive' } } } },
              { serviceOrder: { equipment: { name: { contains: term, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const inspections = await this.prisma.inspection.findMany({
      where,
      include: INSPECTION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return inspections.map((inspection) => toInspectionRecord(inspection));
  }

  async get(id: string): Promise<InspectionRecord> {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: INSPECTION_INCLUDE,
    });

    if (!inspection) {
      throw new NotFoundException('Inspección no encontrada');
    }

    return toInspectionRecord(inspection);
  }

  async create(
    input: CreateInspectionInput,
    actor: AuthUser,
  ): Promise<InspectionRecord> {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: input.serviceOrderId },
      select: { id: true, orderNumber: true, status: true },
    });

    if (!order) {
      throw new BadRequestException('La orden de servicio no existe');
    }

    const existing = await this.prisma.inspection.findFirst({
      where: {
        serviceOrderId: input.serviceOrderId,
        status: { notIn: ['REJECTED', 'CANCELLED'] },
      },
      select: { code: true },
    });

    if (existing) {
      throw new BadRequestException(
        `La ODS ya tiene una inspección activa (${existing.code})`,
      );
    }

    for (const task of input.tasks) {
      await this.validateTaskInput(task.jobPositionId, task.assignedToId ?? null);
    }

    const now = new Date();
    let inspection: InspectionWithRelations | undefined;

    for (let attempt = 0; attempt < 5 && !inspection; attempt += 1) {
      const code = await this.generateCode();

      try {
        inspection = await this.prisma.$transaction(async (tx) => {
          const created = await tx.inspection.create({
            data: {
              code,
              serviceOrderId: input.serviceOrderId,
              technicalDetails: input.technicalDetails ?? null,
              createdById: actor.id,
              status: 'IN_PROGRESS',
              startedAt: now,
              tasks: {
                create: input.tasks.map((task, index) => ({
                  jobPositionId: task.jobPositionId,
                  assignedToId: task.assignedToId ?? null,
                  createdById: actor.id,
                  sequence: (index + 1) * 10,
                  stage: task.stage,
                  source: 'INSPECTION',
                  description: task.description,
                  criteria: task.criteria ?? null,
                  formRef: task.formRef ?? null,
                  status: 'PENDING',
                  requiresEvidence: task.requiresEvidence,
                  estimatedMinutes: task.estimatedMinutes ?? null,
                })),
              },
            },
            include: INSPECTION_INCLUDE,
          });

          if (order.status === 'OPEN') {
            await tx.serviceOrder.update({
              where: { id: order.id },
              data: { status: 'IN_PROGRESS' },
            });
          }

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

    if (!inspection) {
      throw new BadRequestException('No se pudo generar la numeración de la inspección');
    }

    await this.audit.record({
      userId: actor.id,
      action: 'CREATE',
      entity: 'Inspection',
      entityId: inspection.id,
      changes: {
        after: {
          code: inspection.code,
          serviceOrderId: inspection.serviceOrderId,
          tasks: input.tasks.length,
        },
      },
    });

    return toInspectionRecord(inspection);
  }

  async update(
    id: string,
    input: UpdateInspectionInput,
    actor: AuthUser,
  ): Promise<InspectionRecord> {
    const inspection = await this.findIncluded(id);
    this.ensureEditable(inspection.status);

    await this.prisma.inspection.update({
      where: { id },
      data: {
        ...(input.technicalDetails !== undefined
          ? { technicalDetails: input.technicalDetails }
          : {}),
        ...(inspection.status === 'REJECTED' ? { status: 'IN_PROGRESS' } : {}),
      },
    });

    await this.audit.record({
      userId: actor.id,
      action: 'UPDATE',
      entity: 'Inspection',
      entityId: id,
      changes: { after: input },
    });

    return this.get(id);
  }

  async addTask(
    inspectionId: string,
    input: CreateTaskInput,
    actor: AuthUser,
  ): Promise<InspectionRecord> {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: { tasks: { select: { sequence: true }, orderBy: { sequence: 'desc' }, take: 1 } },
    });

    if (!inspection) {
      throw new NotFoundException('Inspección no encontrada');
    }

    this.ensureEditable(inspection.status);
    await this.validateTaskInput(input.jobPositionId, input.assignedToId ?? null);

    const sequence = (inspection.tasks[0]?.sequence ?? 0) + 10;

    await this.prisma.task.create({
      data: {
        inspectionId,
        jobPositionId: input.jobPositionId,
        assignedToId: input.assignedToId ?? null,
        createdById: actor.id,
        sequence,
        stage: input.stage,
        source: 'INSPECTION',
        description: input.description,
        criteria: input.criteria ?? null,
        formRef: input.formRef ?? null,
        status: 'PENDING',
        requiresEvidence: input.requiresEvidence,
        estimatedMinutes: input.estimatedMinutes ?? null,
      },
    });

    await this.recomputeStatus(inspectionId);

    await this.audit.record({
      userId: actor.id,
      action: 'CREATE',
      entity: 'Task',
      entityId: inspectionId,
      changes: { after: { description: input.description, stage: input.stage } },
    });

    return this.get(inspectionId);
  }

  async updateTask(
    inspectionId: string,
    taskId: string,
    input: UpdateTaskInput,
    actor: AuthUser,
  ): Promise<InspectionRecord> {
    const inspection = await this.findIncluded(inspectionId);
    this.ensureEditable(inspection.status);

    const task = inspection.tasks.find((candidate) => candidate.id === taskId);

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    if (task.status === 'COMPLETED') {
      throw new BadRequestException('No se puede editar una tarea completada');
    }

    const nextJobPositionId = input.jobPositionId ?? task.jobPositionId;
    const nextAssignedToId =
      input.assignedToId !== undefined ? input.assignedToId : task.assignedToId;

    await this.validateTaskInput(nextJobPositionId, nextAssignedToId ?? null);

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(input.stage !== undefined ? { stage: input.stage } : {}),
        ...(input.jobPositionId !== undefined
          ? { jobPositionId: input.jobPositionId }
          : {}),
        ...(input.assignedToId !== undefined
          ? { assignedToId: input.assignedToId }
          : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.criteria !== undefined ? { criteria: input.criteria } : {}),
        ...(input.formRef !== undefined ? { formRef: input.formRef } : {}),
        ...(input.requiresEvidence !== undefined
          ? { requiresEvidence: input.requiresEvidence }
          : {}),
        ...(input.estimatedMinutes !== undefined
          ? { estimatedMinutes: input.estimatedMinutes }
          : {}),
      },
    });

    await this.recomputeStatus(inspectionId);

    await this.audit.record({
      userId: actor.id,
      action: 'UPDATE',
      entity: 'Task',
      entityId: taskId,
      changes: { after: input },
    });

    return this.get(inspectionId);
  }

  async deleteTask(
    inspectionId: string,
    taskId: string,
    actor: AuthUser,
  ): Promise<InspectionRecord> {
    const inspection = await this.findIncluded(inspectionId);
    this.ensureEditable(inspection.status);

    const task = inspection.tasks.find((candidate) => candidate.id === taskId);

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    if (task.status === 'COMPLETED') {
      throw new BadRequestException('No se puede eliminar una tarea completada');
    }

    await this.prisma.task.delete({ where: { id: taskId } });
    await this.recomputeStatus(inspectionId);

    await this.audit.record({
      userId: actor.id,
      action: 'DELETE',
      entity: 'Task',
      entityId: taskId,
      changes: { before: { description: task.description } },
    });

    return this.get(inspectionId);
  }

  async approve(id: string, actor: AuthUser): Promise<InspectionRecord> {
    const inspection = await this.findIncluded(id);

    if (inspection.status !== 'COMPLETED') {
      throw new BadRequestException('La inspección todavía no está completada');
    }

    if (inspection.tasks.some((task) => task.status !== 'COMPLETED')) {
      throw new BadRequestException('Todas las tareas deben estar completadas');
    }

    await this.prisma.inspection.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: actor.id,
        approvedAt: new Date(),
        rejectionReason: null,
      },
    });

    await this.audit.record({
      userId: actor.id,
      action: 'APPROVE',
      entity: 'Inspection',
      entityId: id,
      changes: { from: inspection.status, to: 'APPROVED' },
    });

    return this.get(id);
  }

  async reject(
    id: string,
    input: RejectInspectionInput,
    actor: AuthUser,
  ): Promise<InspectionRecord> {
    const inspection = await this.findIncluded(id);

    if (['APPROVED', 'CANCELLED'].includes(inspection.status)) {
      throw new BadRequestException('La inspección ya está aprobada o cancelada');
    }

    const maxStage = inspection.tasks.reduce(
      (max, task) => Math.max(max, task.stage),
      0,
    );

    await this.prisma.$transaction(async (tx) => {
      if (maxStage > 0) {
        await tx.task.updateMany({
          where: {
            inspectionId: id,
            stage: maxStage,
            status: 'COMPLETED',
          },
          data: { status: 'PENDING', completedAt: null },
        });
      }

      await tx.inspection.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: input.reason,
          approvedById: null,
          approvedAt: null,
          completedAt: null,
        },
      });
    });

    await this.audit.record({
      userId: actor.id,
      action: 'REJECT',
      entity: 'Inspection',
      entityId: id,
      changes: { reason: input.reason },
    });

    return this.get(id);
  }

  private async findIncluded(id: string): Promise<InspectionWithRelations> {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: INSPECTION_INCLUDE,
    });

    if (!inspection) {
      throw new NotFoundException('Inspección no encontrada');
    }

    return inspection;
  }

  private ensureEditable(status: string): void {
    if (['APPROVED', 'CANCELLED'].includes(status)) {
      throw new BadRequestException(
        'La inspección ya está aprobada o cancelada y no se puede modificar',
      );
    }
  }

  private async validateTaskInput(
    jobPositionId: string,
    assignedToId: string | null,
  ): Promise<void> {
    const position = await this.prisma.jobPosition.findUnique({
      where: { id: jobPositionId },
    });

    if (!position || !position.isActive) {
      throw new BadRequestException('El puesto de trabajo no existe o está inactivo');
    }

    if (assignedToId) {
      const user = await this.prisma.user.findUnique({ where: { id: assignedToId } });

      if (!user || !user.isActive) {
        throw new BadRequestException('El usuario asignado no existe o está inactivo');
      }

      if (user.jobPositionId !== jobPositionId) {
        throw new BadRequestException(
          'El usuario asignado no pertenece al puesto de trabajo de la tarea',
        );
      }
    }
  }

  private async recomputeStatus(inspectionId: string): Promise<void> {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        tasks: { select: { status: true } },
        serviceOrder: { select: { id: true, status: true } },
      },
    });

    if (!inspection || ['APPROVED', 'CANCELLED'].includes(inspection.status)) {
      return;
    }

    const allCompleted =
      inspection.tasks.length > 0 &&
      inspection.tasks.every((task) => task.status === 'COMPLETED');

    await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        status: allCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: allCompleted ? new Date() : null,
      },
    });

    if (inspection.serviceOrder.status === 'OPEN') {
      await this.prisma.serviceOrder.update({
        where: { id: inspection.serviceOrder.id },
        data: { status: 'IN_PROGRESS' },
      });
    }
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INS-${year}-`;
    const rows = await this.prisma.inspection.findMany({
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
