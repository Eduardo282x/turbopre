import { StatusBadge } from '@/components/common/status-badge';
import {
  CALIBRATION_STATUS_META,
  FIELD_STATUS_META,
  LOAN_STATUS_META,
  NONCONFORMITY_SEVERITY_META,
  NONCONFORMITY_STATUS_META,
  PART_STATUS_META,
  PHASE_STATUS_META,
  PRIORITY_META,
  PROJECT_PHASE_META,
  QUALITY_RECORD_TYPE_META,
  QUALITY_RESULT_META,
  ROUTE_STATUS_META,
  SERVICE_MODE_META,
  SERVICE_ORDER_STATUS_META,
  SPARE_PART_STATUS_META,
  SUPPLY_STATUS_META,
} from '@/features/preview/config';
import type {
  FieldJobStatus,
  LoanStatus,
  NonConformitySeverity,
  NonConformityStatus,
  PartStatus,
  PhaseStatus,
  Priority,
  ProjectPhase,
  QualityRecordType,
  QualityResult,
  RouteStatus,
  ServiceMode,
  ServiceOrderStatus,
  SparePartStatus,
  SupplyStatus,
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

export function ServiceModeBadge({ mode }: { mode: ServiceMode }) {
  const meta = SERVICE_MODE_META[mode];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function ServiceOrderStatusBadge({ status }: { status: ServiceOrderStatus }) {
  const meta = SERVICE_ORDER_STATUS_META[status];
  return (
    <StatusBadge tone={meta.tone} dot>
      {meta.label}
    </StatusBadge>
  );
}

export function QualityRecordTypeBadge({ type }: { type: QualityRecordType }) {
  const meta = QUALITY_RECORD_TYPE_META[type];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function QualityResultBadge({ result }: { result: QualityResult }) {
  const meta = QUALITY_RESULT_META[result];
  return (
    <StatusBadge tone={meta.tone} dot>
      {meta.label}
    </StatusBadge>
  );
}

export function NonConformitySeverityBadge({ severity }: { severity: NonConformitySeverity }) {
  const meta = NONCONFORMITY_SEVERITY_META[severity];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function NonConformityStatusBadge({ status }: { status: NonConformityStatus }) {
  const meta = NONCONFORMITY_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function FieldStatusBadge({ status }: { status: FieldJobStatus }) {
  const meta = FIELD_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function ProjectPhaseBadge({ phase }: { phase: ProjectPhase }) {
  const meta = PROJECT_PHASE_META[phase];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function SupplyStatusBadge({ status }: { status: SupplyStatus }) {
  const meta = SUPPLY_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function CalibrationStatusBadge({ status }: { status: 'VALID' | 'DUE_SOON' | 'EXPIRED' | 'NONE' }) {
  const meta = CALIBRATION_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}
