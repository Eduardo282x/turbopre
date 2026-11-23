import { BadgeCheck, CheckCircle2, Eye, ShieldCheck, Timer, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { PriorityBadge } from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { FormDialog } from '@/components/common/form-dialog';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getPendingApprovals } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { RouteSheetWithRelations } from '@/features/preview/types';
import { daysUntil, formatDate } from '@/lib/formatters';
import { canApproveRoute } from '@/lib/permissions';

export function ApprovalsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const approveRouteSheet = usePreviewStore((state) => state.approveRouteSheet);
  const rejectRouteSheet = usePreviewStore((state) => state.rejectRouteSheet);
  const navigate = useNavigate();
  const [approving, setApproving] = useState<RouteSheetWithRelations | null>(null);
  const [rejecting, setRejecting] = useState<RouteSheetWithRelations | null>(null);
  const [reason, setReason] = useState('');

  if (!user) return null;

  const routes = getPendingApprovals(db);
  const critical = routes.filter((route) => route.priority === 'CRITICAL').length;
  const dueSoon = routes.filter((route) => daysUntil(route.dueDate) <= 3).length;

  const columns: DataTableColumn<RouteSheetWithRelations>[] = [
    {
      id: 'route',
      header: 'Hoja de ruta',
      cell: (route) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{route.code}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            ODS {route.serviceOrder.code} · {route.serviceOrder.subCode}
          </p>
        </div>
      ),
      sortable: true,
      sortValue: (route) => route.code,
    },
    {
      id: 'client',
      header: 'Cliente / equipo',
      cell: (route) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{route.client?.name ?? '—'}</p>
          <p className="text-muted-foreground">
            {route.asset?.manufacturer} {route.asset?.model} · {route.equipmentCode}
          </p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'priority',
      header: 'Prioridad',
      cell: (route) => <PriorityBadge priority={route.priority} />,
    },
    {
      id: 'due',
      header: 'Entrega',
      cell: (route) => {
        const days = daysUntil(route.dueDate);
        return (
          <div className="text-xs">
            <p className="text-foreground">{formatDate(route.dueDate)}</p>
            <p className={days < 0 ? 'text-destructive' : days <= 3 ? 'text-warning' : 'text-muted-foreground'}>
              {days < 0 ? `${Math.abs(days)} días de retraso` : `En ${days} días`}
            </p>
          </div>
        );
      },
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) => new Date(route.dueDate),
    },
    {
      id: 'progress',
      header: 'Tareas',
      cell: (route) => (
        <ProgressBar
          value={route.progress}
          label={`${route.completedTasks} de ${route.totalTasks}`}
          className="w-36"
        />
      ),
      hideOnMobile: true,
    },
    {
      id: 'prepared',
      header: 'Preparada por',
      cell: (route) => (
        <div className="text-xs text-muted-foreground">
          <p>{route.creator.name}</p>
          <p>{formatDate(route.preparedAt)}</p>
        </div>
      ),
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gerencia"
        title="Aprobaciones"
        description="El Gerente revisa la hoja de ruta antes de liberarla a los operadores en taller."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Pendientes" value={routes.length} hint="Hojas por aprobar" icon={BadgeCheck} tone="warning" />
        <KpiCard label="Críticas" value={critical} hint="Prioridad crítica" icon={ShieldCheck} tone="danger" />
        <KpiCard label="Por vencer" value={dueSoon} hint="Entrega en 3 días o menos" icon={Timer} tone="accent" />
      </div>

      {routes.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Sin aprobaciones pendientes"
          description="Cuando Ingeniería envíe una hoja de ruta, aparecerá aquí para revisión."
        />
      ) : (
        <DataTable
          data={routes}
          columns={columns}
          getRowId={(route) => route.id}
          search={{
            placeholder: 'Buscar por hoja, ODS, cliente o equipo…',
            getText: (route) =>
              `${route.code} ${route.serviceOrder.code} ${route.client?.name ?? ''} ${route.asset?.model ?? ''}`,
          }}
          actions={[
            {
              label: 'Ver hoja',
              icon: Eye,
              onSelect: (route) => navigate(`/hojas-de-ruta/${route.id}`),
            },
            {
              label: 'Aprobar',
              icon: CheckCircle2,
              hidden: (route) => !canApproveRoute(user, route),
              onSelect: (route) => setApproving(route),
            },
            {
              label: 'Rechazar',
              icon: XCircle,
              variant: 'destructive',
              hidden: (route) => !canApproveRoute(user, route),
              onSelect: (route) => {
                setRejecting(route);
                setReason('');
              },
            },
          ]}
          onRowClick={(route) => navigate(`/hojas-de-ruta/${route.id}`)}
          pageSize={10}
          emptyTitle="Sin aprobaciones"
          emptyDescription="No hay hojas pendientes de aprobación."
          caption="Hojas de ruta pendientes de aprobación"
        />
      )}

      <ConfirmDialog
        open={Boolean(approving)}
        onOpenChange={(open) => {
          if (!open) setApproving(null);
        }}
        title="Aprobar hoja de ruta"
        description={`La hoja ${approving?.code ?? ''} se liberará a taller y se desbloqueará la primera etapa.`}
        confirmLabel="Aprobar y liberar"
        onConfirm={() => {
          if (!approving) return;
          approveRouteSheet(approving.id, user.id);
          toast.success(`${approving.code} aprobada y liberada`);
          setApproving(null);
        }}
      />

      <FormDialog
        open={Boolean(rejecting)}
        onOpenChange={(open) => {
          if (!open) setRejecting(null);
        }}
        title="Rechazar hoja de ruta"
        description="La hoja vuelve a Ingeniería en borrador con el motivo indicado."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setRejecting(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!rejecting) return;
                if (!reason.trim()) {
                  toast.error('Escribe el motivo del rechazo');
                  return;
                }
                rejectRouteSheet(rejecting.id, user.id, reason.trim());
                toast.info('Hoja devuelta a Ingeniería');
                setRejecting(null);
                setReason('');
              }}
            >
              Confirmar rechazo
            </Button>
          </>
        }
      >
        <Textarea
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Ej: Falta la firma del responsable en el paso 40."
        />
      </FormDialog>
    </div>
  );
}
