import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AuthUser,
  CompleteTaskInput,
  TaskContext,
  TaskRecord,
  TaskStatus,
} from '@turbopre/shared';
import { canCompleteTask, isTaskBlocked } from '@turbopre/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import { toInspectionServiceOrder } from '../inspections/inspection-mapper.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  TASK_INCLUDE,
  toTaskRecord,
  type TaskSibling,
  type TaskWithRelations,
} from './task-mapper.js';

type TaskWithParent = TaskWithRelations & {
  inspection:
    | {
        id: string;
        code: string;
        status: string;
        serviceOrder: {
          id: string;
          orderNumber: string;
          description: string;
          scope: string;
          priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          dueAt: Date | null;
          client: { name: string };
          site: { name: string };
          equipment: { code: string; name: string; serialNumber: string | null };
        };
      }
    | null;
  routeSheet: { id: string; code: string; status: string } | null;
};

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async my(actor: AuthUser): Promise<TaskContext[]> {
    if (actor.role === 'ADMIN') {
      return [];
    }

    const ownership: Prisma.TaskWhereInput[] = [{ assignedToId: actor.id }];

    if (actor.jobPositionId) {
      ownership.push({
        assignedToId: null,
        jobPositionId: actor.jobPositionId,
      });
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        OR: ownership,
        AND: [
          {
            OR: [{ inspectionId: { not: null } }, { routeSheetId: { not: null } }],
          },
        ],
      },
      include: {
        ...TASK_INCLUDE,
        inspection: {
          include: {
            serviceOrder: {
              include: {
                client: { select: { name: true } },
                site: { select: { name: true } },
                equipment: { select: { code: true, name: true, serialNumber: true } },
              },
            },
          },
        },
        routeSheet: { select: { id: true, code: true, status: true } },
      },
      orderBy: [{ stage: 'asc' }, { sequence: 'asc' }],
    });

    if (tasks.length === 0) {
      return [];
    }

    const siblingsByParent = await this.loadSiblings(tasks);

    return tasks.map((task) => {
      const siblings =
        (task.inspectionId
          ? siblingsByParent.get(`inspection:${task.inspectionId}`)
          : task.routeSheetId
            ? siblingsByParent.get(`route:${task.routeSheetId}`)
            : undefined) ?? [];

      return {
        task: toTaskRecord(task, siblings),
        inspection: task.inspection
          ? {
              id: task.inspection.id,
              code: task.inspection.code,
              status: task.inspection.status as never,
              serviceOrder: toInspectionServiceOrder(task.inspection.serviceOrder),
            }
          : null,
        routeSheet: task.routeSheet
          ? {
              id: task.routeSheet.id,
              code: task.routeSheet.code,
              status: task.routeSheet.status,
            }
          : null,
      };
    });
  }

  async complete(
    taskId: string,
    actor: AuthUser,
    input: CompleteTaskInput,
  ): Promise<TaskRecord> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: TASK_INCLUDE,
    });

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    if (!task.inspectionId) {
      throw new BadRequestException(
        'La ejecución de tareas de hoja de ruta se conectará en la siguiente fase',
      );
    }

    const inspection = await this.prisma.inspection.findUnique({
      where: { id: task.inspectionId },
      include: {
        tasks: { select: { id: true, stage: true, status: true } },
        serviceOrder: { select: { id: true, status: true } },
      },
    });

    if (!inspection) {
      throw new NotFoundException('Inspección no encontrada');
    }

    if (['APPROVED', 'CANCELLED'].includes(inspection.status)) {
      throw new BadRequestException('La inspección ya está aprobada o cancelada');
    }

    const siblings: TaskSibling[] = inspection.tasks;
    const blocked = isTaskBlocked(siblings, {
      stage: task.stage,
      status: task.status,
    });

    const allowed = canCompleteTask(
      {
        id: actor.id,
        role: actor.role,
        jobPositionId: actor.jobPositionId ?? null,
      },
      {
        status: task.status as TaskStatus,
        assignedToId: task.assignedToId,
        jobPositionId: task.jobPositionId,
        blocked,
      },
    );

    if (!allowed) {
      throw new ForbiddenException('No puedes completar esta tarea');
    }

    if (
      task.requiresEvidence &&
      !input.evidenceUrl &&
      task.attachments.length === 0
    ) {
      throw new BadRequestException(
        'Esta tarea requiere una evidencia antes de marcarse como completada',
      );
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          startedAt: task.startedAt ?? now,
          completedAt: now,
          ...(input.observations
            ? {
                notes: task.notes
                  ? `${task.notes}\n${input.observations}`
                  : input.observations,
              }
            : {}),
        },
      });

      if (input.evidenceUrl) {
        await tx.taskAttachment.create({
          data: {
            taskId,
            url: input.evidenceUrl,
            type: 'PHOTO',
            uploadedById: actor.id,
          },
        });
      }
    });

    const updatedTasks = await this.prisma.task.findMany({
      where: { inspectionId: inspection.id },
      select: { id: true, stage: true, status: true },
    });
    const allCompleted =
      updatedTasks.length > 0 &&
      updatedTasks.every((candidate) => candidate.status === 'COMPLETED');

    await this.prisma.inspection.update({
      where: { id: inspection.id },
      data: {
        status: allCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: allCompleted ? now : null,
      },
    });

    if (inspection.serviceOrder.status === 'OPEN') {
      await this.prisma.serviceOrder.update({
        where: { id: inspection.serviceOrder.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    await this.audit.record({
      userId: actor.id,
      action: 'COMPLETE',
      entity: 'Task',
      entityId: taskId,
      changes: {
        after: {
          status: 'COMPLETED',
          inspectionId: inspection.id,
          evidence: Boolean(input.evidenceUrl),
        },
      },
    });

    const updated = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: TASK_INCLUDE,
    });

    if (!updated) {
      throw new NotFoundException('Tarea no encontrada');
    }

    return toTaskRecord(updated, updatedTasks);
  }

  private async loadSiblings(
    tasks: TaskWithParent[],
  ): Promise<Map<string, TaskSibling[]>> {
    const inspectionIds = [
      ...new Set(
        tasks
          .map((task) => task.inspectionId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const routeIds = [
      ...new Set(
        tasks
          .map((task) => task.routeSheetId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const filters: Prisma.TaskWhereInput[] = [];

    if (inspectionIds.length > 0) {
      filters.push({ inspectionId: { in: inspectionIds } });
    }

    if (routeIds.length > 0) {
      filters.push({ routeSheetId: { in: routeIds } });
    }

    if (filters.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.task.findMany({
      where: { OR: filters },
      select: {
        id: true,
        inspectionId: true,
        routeSheetId: true,
        stage: true,
        status: true,
      },
    });

    const map = new Map<string, TaskSibling[]>();

    for (const row of rows) {
      const key = row.inspectionId
        ? `inspection:${row.inspectionId}`
        : row.routeSheetId
          ? `route:${row.routeSheetId}`
          : null;

      if (!key) continue;

      const current = map.get(key) ?? [];
      current.push({ id: row.id, stage: row.stage, status: row.status });
      map.set(key, current);
    }

    return map;
  }
}
