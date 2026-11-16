import { StatusBadge } from '@/components/common/status-badge';
import {
  LOAN_STATUS_META,
  PART_STATUS_META,
  PHASE_STATUS_META,
  PRIORITY_META,
  ROUTE_STATUS_META,
  SPARE_PART_STATUS_META,
} from '@/features/preview/config';
import type { LoanStatus, PartStatus, PhaseStatus, Priority, RouteStatus, SparePartStatus } from '@/features/preview/types';

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

export function PhaseStatusBadge({ status }: { status: PhaseStatus }) {
  const meta = PHASE_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function PartStatusBadge({ status }: { status: PartStatus }) {
  const meta = PART_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function SparePartStatusBadge({ status }: { status: SparePartStatus }) {
  const meta = SPARE_PART_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const meta = LOAN_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}
