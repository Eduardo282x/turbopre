import { StatusBadge } from '@/components/common/status-badge';
import type { EquipmentType, ProjectStatus, ServiceOrderWorkflowStatus } from '@turbopre/shared';
import {
  CALIBRATION_STATUS_META,
  EQUIPMENT_TYPE_META,
  INSPECTION_STATUS_META,
  INVENTORY_STATUS_META,
  LOAN_STATUS_META,
  POSITION_BY_ID,
  PRIORITY_META,
  PROCESS_BY_ID,
  PROJECT_PHASE_META,
  PROJECT_STATUS_META,
  ROUTE_STATUS_META,
  SERVICE_ORDER_STATUS_META,
  SPARE_DESTINATION_META,
  SPARE_ITEM_STATUS_META,
  TASK_STATUS_META,
} from '@/features/preview/config';
import type {
  InspectionStatus,
  InventoryStatus,
  LoanStatus,
  PositionId,
  Priority,
  ProcessId,
  ProjectPhase,
  RouteStatus,
  SpareDestination,
  SpareItemStatus,
  TaskStatus,
} from '@/features/preview/types';

export function RouteStatusBadge({ status }: { status: RouteStatus }) {
  const meta = ROUTE_STATUS_META[status];
  return (
    <StatusBadge tone={meta.tone} dot>
      {meta.label}
    </StatusBadge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function InspectionStatusBadge({ status }: { status: InspectionStatus }) {
  const meta = INSPECTION_STATUS_META[status];
  return (
    <StatusBadge tone={meta.tone} dot>
      {meta.label}
    </StatusBadge>
  );
}

export function ServiceOrderStatusBadge({ status }: { status: ServiceOrderWorkflowStatus }) {
  const meta = SERVICE_ORDER_STATUS_META[status];
  return (
    <StatusBadge tone={meta.tone} dot>
      {meta.label}
    </StatusBadge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const meta = TASK_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function SpareItemStatusBadge({ status }: { status: SpareItemStatus }) {
  const meta = SPARE_ITEM_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function SpareDestinationBadge({ destination }: { destination: SpareDestination }) {
  const meta = SPARE_DESTINATION_META[destination];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const meta = LOAN_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  const meta = INVENTORY_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function ProjectPhaseBadge({ phase }: { phase: ProjectPhase }) {
  const meta = PROJECT_PHASE_META[phase];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function EquipmentTypeBadge({ type }: { type: EquipmentType }) {
  const meta = EQUIPMENT_TYPE_META[type];
  return <StatusBadge tone="neutral">{meta.shortLabel}</StatusBadge>;
}

export function CalibrationStatusBadge({
  status,
}: {
  status: 'VALID' | 'DUE_SOON' | 'EXPIRED' | 'NONE';
}) {
  const meta = CALIBRATION_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function ProcessBadge({ processId }: { processId: ProcessId }) {
  const process = PROCESS_BY_ID[processId];
  return (
    <StatusBadge tone="neutral" className="border" style={{ borderColor: `${process.color}55`, color: process.color }}>
      {process.shortName}
    </StatusBadge>
  );
}

export function PositionBadge({ positionId }: { positionId: PositionId }) {
  const position = POSITION_BY_ID[positionId];
  return (
    <StatusBadge
      tone="neutral"
      className="border"
      style={{ borderColor: `${position.color}55`, color: position.color }}
    >
      {position.name}
    </StatusBadge>
  );
}
