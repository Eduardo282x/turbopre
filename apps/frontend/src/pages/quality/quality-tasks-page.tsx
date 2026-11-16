import { CheckCircle2, Clock3, Play, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PhaseStatusBadge, RouteStatusBadge } from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { AREA_BY_ID } from '@/features/preview/config';
import { getPhaseContexts, type PhaseWithContext } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { formatDate } from '@/lib/formatters';
import { canCompletePhase } from '@/lib/permissions';
import { CompletePhaseDialog } from '@/pages/route-sheets/complete-phase-dialog';

export function QualityTasksPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const completePhase = usePreviewStore((state) => state.completePhase);
  const [context, setContext] = useState<PhaseWithContext | null>(null);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const allQuality = getPhaseContexts(db).filter(
    (item) => item.phase.areaId === 'quality' || item.phase.type === 'QUALITY',
  );
  const tasks = allQuality.filter((item) => item.phase.status !== 'COMPLETED');
  const pending = tasks.filter((item) => item.phase.status === 'PENDING').length;
  const inProgress = tasks.filter((item) => item.phase.status === 'IN_PROGRESS').length;
  const completed = allQuality.filter((item) => item.phase.status === 'COMPLETED').length;

  const columns: DataTableColumn<PhaseWithContext>[] = [
    {
      id: 'route',
      header: 'Hoja de ruta',
      cell: (item) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{item.route.code}</p>
          <p className="max-w-56 truncate text-xs text-muted-foreground">{item.component.name}</p>
          <p className="text-[11px] text-muted-foreground/70">{item.client?.name ?? 'Sin cliente'}</p>
        </div>
      ),
      sortable: true,
      sortValue: (item) => item.route.code,
    },
    {
      id: 'part',
      header: 'Parte',
      cell: (item) => <span className="text-sm">{item.part.name}</span>,
      hideOnMobile: true,
    },
    {
      id: 'phase',
      header: 'Fase de calidad',
      cell: (item) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{item.phase.name}</p>
          <p className="max-w-64 truncate text-xs text-muted-foreground">{item.phase.description}</p>
        </div>
      ),
    },
    {
      id: 'area',
      header: 'Área',
      cell: (item) => <span className="text-xs">{AREA_BY_ID[item.phase.areaId].shortName}</span>,
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (item) => <PhaseStatusBadge status={item.phase.status} />,
    },
    {
      id: 'routeStatus',
      header: 'Hoja',
      cell: (item) => <RouteStatusBadge status={item.route.status} />,
      hideOnMobile: true,
    },
    {
      id: 'due',
      header: 'Entrega',
      cell: (item) => <span className="text-xs text-muted-foreground">{formatDate(item.route.dueDate)}</span>,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calidad"
        title="Mis tareas de calidad"
        description="Fases de liberación y verificación final antes del visto bueno del expediente."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Pendientes" value={pending} hint="Esperan inicio" icon={Clock3} tone="warning" />
        <KpiCard label="En proceso" value={inProgress} hint="Verificación activa" icon={Play} tone="accent" />
        <KpiCard label="Completadas" value={completed} hint="Con evidencia registrada" icon={ShieldCheck} tone="success" />
      </div>

      <DataTable
        data={tasks}
        columns={columns}
        getRowId={(item) => item.phase.id}
        search={{
          placeholder: 'Buscar por hoja, componente, parte o fase…',
          getText: (item) => `${item.route.code} ${item.component.name} ${item.part.name} ${item.phase.name}`,
        }}
        actions={[
          {
            label: 'Completar verificación',
            icon: CheckCircle2,
            hidden: (item) => !canCompletePhase(user, item.phase) || item.phase.status === 'BLOCKED',
            onSelect: (item) => {
              setContext(item);
              setOpen(true);
            },
          },
        ]}
        pageSize={10}
        emptyTitle="Sin tareas de calidad"
        emptyDescription="Las fases de liberación aparecerán cuando las áreas avancen."
        caption="Tareas de calidad"
      />

      <CompletePhaseDialog
        open={open}
        onOpenChange={setOpen}
        context={context}
        onSubmit={(payload) => {
          if (!context) return;
          completePhase(context.phase.id, user.id, payload);
          toast.success('Verificación de calidad completada');
        }}
      />
    </div>
  );
}
