import { CheckCircle2, ClipboardList, Clock3, Lock, Play } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { PhaseStatusBadge, RouteStatusBadge } from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Button } from '@/components/ui/button';
import { AREA_BY_ID, PHASE_TYPE_LABELS } from '@/features/preview/config';
import { getMyTasks, type PhaseWithContext } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { Phase } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';
import { canCompletePhase } from '@/lib/permissions';
import { CompletePhaseDialog } from '@/pages/route-sheets/complete-phase-dialog';

export function MyTasksPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const completePhase = usePreviewStore((state) => state.completePhase);
  const [context, setContext] = useState<PhaseWithContext | null>(null);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const tasks = getMyTasks(db, user);
  const inProgress = tasks.filter((task) => task.phase.status === 'IN_PROGRESS').length;
  const pending = tasks.filter((task) => task.phase.status === 'PENDING').length;
  const blocked = tasks.filter((task) => task.phase.status === 'BLOCKED').length;

  const openComplete = (task: PhaseWithContext) => {
    setContext(task);
    setOpen(true);
  };

  const columns: DataTableColumn<PhaseWithContext>[] = [
    {
      id: 'route',
      header: 'Hoja de ruta',
      cell: (task) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{task.route.code}</p>
          <p className="max-w-56 truncate text-xs text-muted-foreground">{task.component.name}</p>
          <p className="text-[11px] text-muted-foreground/70">{task.client?.name ?? 'Sin cliente'}</p>
        </div>
      ),
      sortable: true,
      sortValue: (task) => task.route.code,
    },
    {
      id: 'part',
      header: 'Parte',
      cell: (task) => <span className="text-sm">{task.part.name}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (task) => task.part.name,
    },
    {
      id: 'phase',
      header: 'Fase',
      cell: (task) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{task.phase.name}</p>
          <p className="text-xs text-muted-foreground">{PHASE_TYPE_LABELS[task.phase.type]} · Paso {task.phase.order}</p>
        </div>
      ),
      sortable: true,
      sortValue: (task) => task.phase.name,
    },
    {
      id: 'area',
      header: 'Área',
      cell: (task) => <span className="text-xs">{AREA_BY_ID[task.phase.areaId].shortName}</span>,
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (task) => <PhaseStatusBadge status={task.phase.status} />,
      sortable: true,
      sortValue: (task) => task.phase.status,
    },
    {
      id: 'routeStatus',
      header: 'Hoja',
      cell: (task) => <RouteStatusBadge status={task.route.status} />,
      hideOnMobile: true,
    },
    {
      id: 'due',
      header: 'Entrega',
      cell: (task) => <span className="text-xs text-muted-foreground">{formatDate(task.route.dueDate)}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (task) => new Date(task.route.dueDate),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ejecución"
        title="Mis tareas"
        description="Fases asignadas a tu área o rol. Completa solo las que estén desbloqueadas y adjunta evidencia."
        actions={
          <Button variant="outline" asChild>
            <Link to="/hojas-de-ruta">
              <ClipboardList /> Ver hojas de ruta
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Pendientes" value={pending} hint="Listas para comenzar" icon={Clock3} tone="warning" />
        <KpiCard label="En proceso" value={inProgress} hint="Fases activas" icon={Play} tone="accent" />
        <KpiCard label="Bloqueadas" value={blocked} hint="Esperan la fase anterior" icon={Lock} tone="danger" />
      </div>

      <DataTable
        data={tasks}
        columns={columns}
        getRowId={(task) => task.phase.id}
        search={{
          placeholder: 'Buscar por hoja, componente, parte o fase…',
          getText: (task) =>
            `${task.route.code} ${task.component.name} ${task.part.name} ${task.phase.name} ${task.client?.name ?? ''}`,
        }}
        actions={[
          {
            label: 'Completar fase',
            icon: CheckCircle2,
            hidden: (task: PhaseWithContext) =>
              !canCompletePhase(user, task.phase as Phase) || task.phase.status === 'BLOCKED',
            onSelect: openComplete,
          },
        ]}
        pageSize={10}
        emptyTitle="¡Todo al día!"
        emptyDescription="No hay tareas pendientes para tu área en este momento."
        caption="Tareas asignadas al usuario"
      />

      <CompletePhaseDialog
        open={open}
        onOpenChange={setOpen}
        context={context}
        onSubmit={(payload) => {
          if (!context) return;
          completePhase(context.phase.id, user.id, payload);
          toast.success('Fase completada con evidencia');
        }}
      />
    </div>
  );
}
