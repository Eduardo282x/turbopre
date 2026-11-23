import type {
  ProcessKind,
  TaskDisplayStatus,
  TaskRecord,
  TaskSource,
  TaskStatus,
} from '@turbopre/shared';
import { isTaskBlocked } from '@turbopre/shared';

export type TaskSibling = {
  id?: string;
  stage: number;
  status: TaskStatus;
};

export type TaskWithRelations = {
  id: string;
  inspectionId: string | null;
  routeSheetId: string | null;
  jobPositionId: string;
  assignedToId: string | null;
  createdById: string;
  sequence: number | null;
  stage: number;
  source: TaskSource;
  description: string;
  criteria: string | null;
  formRef: string | null;
  status: TaskStatus;
  requiresEvidence: boolean;
  estimatedMinutes: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  jobPosition: {
    id: string;
    code: string;
    name: string;
    process: {
      id: string;
      code: string;
      name: string;
      kind: ProcessKind;
    };
  };
  assignedTo: { id: string; fullName: string } | null;
  createdBy: { id: string; fullName: string };
  attachments: Array<{
    id: string;
    url: string;
    isSelectedForAnnex: boolean | null;
    createdAt: Date;
  }>;
};

export const TASK_INCLUDE = {
  jobPosition: {
    include: {
      process: true,
    },
  },
  assignedTo: { select: { id: true, fullName: true } },
  createdBy: { select: { id: true, fullName: true } },
  attachments: {
    select: {
      id: true,
      url: true,
      isSelectedForAnnex: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} as const;

export function isTaskBlockedRecord(
  task: TaskWithRelations,
  siblings: readonly TaskSibling[],
): boolean {
  return isTaskBlocked(siblings, { stage: task.stage, status: task.status });
}

export function toTaskRecord(
  task: TaskWithRelations,
  siblings: readonly TaskSibling[],
): TaskRecord {
  const blocked = isTaskBlockedRecord(task, siblings);
  const displayStatus: TaskDisplayStatus = blocked ? 'BLOCKED' : task.status;
  const latestAttachment = task.attachments[0];

  return {
    id: task.id,
    inspectionId: task.inspectionId,
    routeSheetId: task.routeSheetId,
    jobPositionId: task.jobPositionId,
    jobPositionCode: task.jobPosition.code,
    jobPositionName: task.jobPosition.name,
    processId: task.jobPosition.process.id,
    processCode: task.jobPosition.process.code,
    processName: task.jobPosition.process.name,
    processKind: task.jobPosition.process.kind,
    assignedToId: task.assignedToId,
    assignedToName: task.assignedTo?.fullName ?? null,
    createdById: task.createdById,
    createdByName: task.createdBy.fullName,
    stage: task.stage,
    sequence: task.sequence,
    source: task.source,
    description: task.description,
    criteria: task.criteria,
    formRef: task.formRef,
    status: task.status,
    displayStatus,
    blocked,
    requiresEvidence: task.requiresEvidence,
    estimatedMinutes: task.estimatedMinutes,
    startedAt: task.startedAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    notes: task.notes,
    evidenceUrl: latestAttachment?.url ?? null,
    annexSelected: latestAttachment?.isSelectedForAnnex ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
