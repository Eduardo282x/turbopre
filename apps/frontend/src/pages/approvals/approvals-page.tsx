import type { RouteSheetRecord } from '@turbopre/shared';
import { canApproveRoute } from '@turbopre/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, CheckCircle2, Eye, ShieldCheck, Timer, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ApiRouteStatusBadge, PriorityBadge } from '@/components/common/badges';
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
import { useRouteSheets } from '@/hooks/use-route-sheets';
import { getApiErrorMessage } from '@/lib/api-error';
import { daysUntil, formatDate } from '@/lib/formatters';
import { routeSheetsService } from '@/services/route-sheets/route-sheets.service';
import { useAuthStore } from '@/stores/use-auth-store';

export function ApprovalsPage() {
  const authUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const routesQuery = useRouteSheets({ status: 'PENDING_APPROVAL' });
  const navigate = useNavigate();
  const [approving, setApproving] = useState<RouteSheetRecord | null>(null);
  const [rejecting, setRejecting] = useState<RouteSheetRecord | null>(null);
  const [reason, setReason] = useState('');

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['route-sheets'] });
    void queryClient.invalidateQueries({ queryKey: ['service-orders'] });
  };

  const approveMutation = useMutation({
    mutationFn: (route: RouteSheetRecord) => routeSheetsService.approve(route.id),
    onSuccess: (route) => {
      invalidate();
      toast.success(`${route.code} aprobada y liberada`);
      setApproving(null);
    },
    onError: (error) =>
      toast.error('No se pudo aprobar la hoja', {
        description: getApiErrorMessage(error),
      }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ route, reason }: { route: RouteSheetRecord; reason: string }) =>
      routeSheetsService.reject(route.id, { reason }),
    onSuccess: (route) => {
      invalidate();
      toast.info(`${route.code} devuelta a Ingeniería`);
      setRejecting(null);
      setReason('');
    },
    onError: (error) =>
      toast.error('No se pudo devolver la hoja', {
        description: getApiErrorMessage(error),
      }),
  });

  if (!authUser) return null;

  const routes = routesQuery.data ?? [];
  const critical = routes.filter(
    (route) => route.serviceOrder.priority === 'CRITICAL',
  ).length;
  const dueSoon = routes.filter(
    (route) =>
      route.serviceOrder.dueAt && daysUntil(route.serviceOrder.dueAt) <= 3,
  ).length;

  const columns: DataTableColumn<RouteSheetRecord>[] = [
    {
      id: 'route',
      header: 'Hoja de ruta',
      cell: (route) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{route.code}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            ODS {route.serviceOrder.orderNumber}
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
          <p className="font-medium text-foreground">
            {route.serviceOrder.clientName}
          </p>
          <p className="text-muted-foreground">
            {route.serviceOrder.equipmentName} · {route.serviceOrder.equipmentCode}
          </p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (route) => <ApiRouteStatusBadge status={route.status} />,
    },
    {
      id: 'priority',
      header: 'Prioridad',
      cell: (route) => <PriorityBadge priority={route.serviceOrder.priority} />,
    },
    {
      id: 'due',
      header: 'Entrega',
      cell: (route) => {
        if (!route.serviceOrder.dueAt) {
          return <span className="text-xs text-muted-foreground">Sin fecha</span>;
        }
        const days = daysUntil(route.serviceOrder.dueAt);
        return (
          <div className="text-xs">
            <p className="text-foreground">{formatDate(route.serviceOrder.dueAt)}</p>
            <p
              className={
                days < 0
                  ? 'text-destructive'
                  : days <= 3
                    ? 'text-warning'
                    : 'text-muted-foreground'
              }
            >
              {days < 0
                ? `${Math.abs(days)} días de retraso`
                : `En ${days} días`}
            </p>
          </div>
        );
      },
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) =>
        route.serviceOrder.dueAt ? new Date(route.serviceOrder.dueAt) : new Date(0),
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
          <p>{route.createdBy.name}</p>
          <p>{formatDate(route.createdAt)}</p>
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
        <KpiCard
          label="Pendientes"
          value={routes.length}
          hint="Hojas por aprobar"
          icon={BadgeCheck}
          tone="warning"
        />
        <KpiCard
          label="Críticas"
          value={critical}
          hint="Prioridad crítica"
          icon={ShieldCheck}
          tone="danger"
        />
        <KpiCard
          label="Por vencer"
          value={dueSoon}
          hint="Entrega en 3 días o menos"
          icon={Timer}
          tone="accent"
        />
      </div>

      {routesQuery.isLoading ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Cargando aprobaciones…
        </p>
      ) : routes.length === 0 ? (
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
              `${route.code} ${route.serviceOrder.orderNumber} ${route.serviceOrder.clientName} ${route.serviceOrder.equipmentName}`,
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
              hidden: (route) => !canApproveRoute(authUser.role, route.status),
              onSelect: (route) => setApproving(route),
            },
            {
              label: 'Rechazar',
              icon: XCircle,
              variant: 'destructive',
              hidden: (route) => !canApproveRoute(authUser.role, route.status),
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
          approveMutation.mutate(approving);
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
              disabled={rejectMutation.isPending}
              onClick={() => {
                if (!rejecting) return;
                if (!reason.trim()) {
                  toast.error('Escribe el motivo del rechazo');
                  return;
                }
                rejectMutation.mutate({ route: rejecting, reason: reason.trim() });
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
