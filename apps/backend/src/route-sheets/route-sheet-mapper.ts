import type {
  AttachmentType,
  InspectionStatus,
  Priority,
  ReviewDecision,
  ReviewStage,
  RouteSheetDocumentRecord,
  RouteSheetRecord,
  RouteSheetReviewRecord,
  RouteSheetStatus,
  ServiceOrderStatus,
} from '@turbopre/shared';
import { getCurrentStage } from '@turbopre/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { toTaskRecord, TASK_INCLUDE, type TaskWithRelations } from '../tasks/task-mapper.js';

export type RouteSheetWithRelations = {
  id: string;
  code: string;
  serviceOrderId: string;
  inspectionId: string | null;
  status: RouteSheetStatus;
  notes: string | null;
  releasedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; fullName: string };
  inspection: { id: string; code: string; status: InspectionStatus } | null;
  serviceOrder: {
    id: string;
    orderNumber: string;
    description: string;
    scope: string;
    priority: Priority;
    dueAt: Date | null;
    deliveredAt: Date | null;
    status: ServiceOrderStatus;
    client: { name: string };
    site: { name: string };
    equipment: { code: string; name: string; serialNumber: string | null };
  };
  tasks: TaskWithRelations[];
  reviews: Array<{
    id: string;
    stage: ReviewStage;
    decision: ReviewDecision;
    comments: string | null;
    createdAt: Date;
    reviewer: { id: string; fullName: string };
  }>;
  documents: Array<{
    id: string;
    url: string;
    type: AttachmentType;
    createdAt: Date;
    uploadedBy: { id: string; fullName: string };
  }>;
};

export const ROUTE_SHEET_INCLUDE = {
  serviceOrder: {
    include: {
      client: { select: { name: true } },
      site: { select: { name: true } },
      equipment: { select: { code: true, name: true, serialNumber: true } },
    },
  },
  inspection: { select: { id: true, code: true, status: true } },
  createdBy: { select: { id: true, fullName: true } },
  tasks: {
    include: TASK_INCLUDE,
    orderBy: [{ stage: 'asc' as const }, { sequence: 'asc' as const }],
  },
  reviews: {
    include: { reviewer: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  documents: {
    include: { uploadedBy: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.RouteSheetInclude;

export function toRouteSheetRecord(route: RouteSheetWithRelations): RouteSheetRecord {
  const tasks = route.tasks.map((task) => toTaskRecord(task, route.tasks));
  const completedTasks = tasks.filter((task) => task.status === 'COMPLETED').length;
  const totalTasks = tasks.length;
  const currentStage = getCurrentStage(route.tasks) ?? null;
  const activeTask = route.tasks.find(
    (task) => task.status !== 'COMPLETED' && task.status !== 'CANCELLED',
  );

  const reviews: RouteSheetReviewRecord[] = route.reviews.map((review) => ({
    id: review.id,
    stage: review.stage,
    decision: review.decision,
    comments: review.comments,
    reviewer: { id: review.reviewer.id, name: review.reviewer.fullName },
    createdAt: review.createdAt.toISOString(),
  }));

  const documents: RouteSheetDocumentRecord[] = route.documents.map((document) => ({
    id: document.id,
    url: document.url,
    type: document.type,
    uploadedBy: {
      id: document.uploadedBy.id,
      name: document.uploadedBy.fullName,
    },
    createdAt: document.createdAt.toISOString(),
  }));

  return {
    id: route.id,
    code: route.code,
    status: route.status,
    notes: route.notes,
    serviceOrder: {
      id: route.serviceOrder.id,
      orderNumber: route.serviceOrder.orderNumber,
      description: route.serviceOrder.description,
      scope: route.serviceOrder.scope,
      priority: route.serviceOrder.priority,
      dueAt: route.serviceOrder.dueAt?.toISOString() ?? null,
      deliveredAt: route.serviceOrder.deliveredAt?.toISOString() ?? null,
      clientName: route.serviceOrder.client.name,
      siteName: route.serviceOrder.site.name,
      equipmentCode: route.serviceOrder.equipment.code,
      equipmentName: route.serviceOrder.equipment.name,
      equipmentSerial: route.serviceOrder.equipment.serialNumber,
    },
    inspection: route.inspection
      ? {
          id: route.inspection.id,
          code: route.inspection.code,
          status: route.inspection.status,
        }
      : null,
    createdBy: {
      id: route.createdBy.id,
      name: route.createdBy.fullName,
    },
    releasedAt: route.releasedAt?.toISOString() ?? null,
    completedAt: route.completedAt?.toISOString() ?? null,
    createdAt: route.createdAt.toISOString(),
    updatedAt: route.updatedAt.toISOString(),
    tasks,
    reviews,
    documents,
    progress: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    completedTasks,
    totalTasks,
    currentStage,
    activeProcess: activeTask
      ? {
          id: activeTask.jobPosition.process.id,
          code: activeTask.jobPosition.process.code,
          name: activeTask.jobPosition.process.name,
        }
      : null,
  };
}
