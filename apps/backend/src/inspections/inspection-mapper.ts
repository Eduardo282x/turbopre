import type {
  InspectionRecord,
  InspectionServiceOrder,
  InspectionStatus,
  Priority,
} from '@turbopre/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { toTaskRecord, TASK_INCLUDE, type TaskWithRelations } from '../tasks/task-mapper.js';

export type InspectionWithRelations = {
  id: string;
  code: string;
  serviceOrderId: string;
  technicalDetails: string | null;
  status: InspectionStatus;
  approvedAt: Date | null;
  rejectionReason: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; fullName: string };
  approvedBy: { id: string; fullName: string } | null;
  serviceOrder: {
    id: string;
    orderNumber: string;
    description: string;
    scope: string;
    priority: Priority;
    dueAt: Date | null;
    client: { name: string };
    site: { name: string };
    equipment: {
      code: string;
      name: string;
      serialNumber: string | null;
    };
  };
  tasks: TaskWithRelations[];
};

export const INSPECTION_INCLUDE = {
  serviceOrder: {
    include: {
      client: { select: { name: true } },
      site: { select: { name: true } },
      equipment: { select: { code: true, name: true, serialNumber: true } },
    },
  },
  createdBy: { select: { id: true, fullName: true } },
  approvedBy: { select: { id: true, fullName: true } },
  tasks: {
    include: TASK_INCLUDE,
    orderBy: [{ stage: 'asc' }, { sequence: 'asc' }],
  },
} satisfies Prisma.InspectionInclude;

export function toInspectionServiceOrder(
  order: InspectionWithRelations['serviceOrder'],
): InspectionServiceOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    description: order.description,
    scope: order.scope,
    priority: order.priority,
    dueAt: order.dueAt?.toISOString() ?? null,
    clientName: order.client.name,
    siteName: order.site.name,
    equipmentCode: order.equipment.code,
    equipmentName: order.equipment.name,
    equipmentSerial: order.equipment.serialNumber,
  };
}

export function toInspectionRecord(
  inspection: InspectionWithRelations,
): InspectionRecord {
  const tasks = inspection.tasks.map((task) =>
    toTaskRecord(task, inspection.tasks),
  );
  const completedTasks = tasks.filter((task) => task.status === 'COMPLETED').length;
  const totalTasks = tasks.length;

  return {
    id: inspection.id,
    code: inspection.code,
    serviceOrderId: inspection.serviceOrderId,
    serviceOrder: toInspectionServiceOrder(inspection.serviceOrder),
    status: inspection.status,
    technicalDetails: inspection.technicalDetails,
    createdBy: {
      id: inspection.createdBy.id,
      name: inspection.createdBy.fullName,
    },
    approvedBy: inspection.approvedBy
      ? { id: inspection.approvedBy.id, name: inspection.approvedBy.fullName }
      : null,
    approvedAt: inspection.approvedAt?.toISOString() ?? null,
    rejectionReason: inspection.rejectionReason,
    startedAt: inspection.startedAt?.toISOString() ?? null,
    completedAt: inspection.completedAt?.toISOString() ?? null,
    tasks,
    progress: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    completedTasks,
    totalTasks,
    createdAt: inspection.createdAt.toISOString(),
    updatedAt: inspection.updatedAt.toISOString(),
  };
}
