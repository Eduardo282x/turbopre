import type { RouteSheetRecord } from '@turbopre/shared';
import { CheckCircle2, Eye, FolderKanban, Pencil, Plus, ShieldCheck, Timer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiRouteStatusBadge, PriorityBadge } from '@/components/common/badges';
import { EmptyState } from '@/components/common/empty-state';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { useRouteSheets } from '@/hooks/use-route-sheets';
import { daysUntil, formatDate } from '@/lib/formatters';
import { canManageRoutes } from '@/lib/permissions';
import { ROUTE_SHEET_STATUS_META } from '@/lib/route-status';

export function RouteSheetsPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const routesQuery = useRouteSheets(
    statusFilter === 'all' ? undefined : { status: statusFilter },
  );

  const routes = routesQuery.data ?? [];
  const metrics = useMemo(() => {
    const items = routesQuery.data ?? [];

    return {
      total: items.length,
      active: items.filter((route) =>
        ['RELEASED', 'IN_PROGRESS'].includes(route.status),
      ).length,
      pendingApproval: items.filter((route) => route.status === 'PENDING_APPROVAL')
        .length,
      inQuality: items.filter(
        (route) => route.status === 'PENDING_QUALITY_APPROVAL',
      ).length,
      readyForDelivery: items.filter(
        (route) => route.status === 'COMPLETED' && !route.serviceOrder.deliveredAt,
      ).length,
    };
  }, [routesQuery.data]);

  if (!user) return null;

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
          <p className="font-medium text-foreground">{route.serviceOrder.clientName}</p>
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
      sortable: true,
      sortValue: (route) => route.status,
    },
    {
      id: 'priority',
      header: 'Prioridad',
      cell: (route) => <PriorityBadge priority={route.serviceOrder.priority} />,
      hideOnMobile: true,
    },
    {
      id: 'stage',
      header: 'Etapa actual',
      cell: (route) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">
            Etapa {route.currentStage ?? '—'}
          </p>
          <p className="text-muted-foreground">
            {route.activeProcess?.name ?? 'Sin proceso activo'}
          </p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (route) => (
        <ProgressBar value={route.progress} className="w-28" showValue />
      ),
      hideOnMobile: true,
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
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ingeniería y soporte técnico"
        title="Hojas de ruta"
        description="Secuencia de tareas por etapa y puesto. Los primeros pasos vienen de la inspección aprobada."
        actions={
          canManageRoutes(user) ? (
            <Button asChild>
              <Link to="/hojas-de-ruta/nueva">
                <Plus /> Nueva hoja de ruta
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Hojas totales"
          value={metrics.total}
          hint="Órdenes con plan de trabajo"
          icon={FolderKanban}
          tone="accent"
        />
        <KpiCard
          label="En ejecución"
          value={metrics.active}
          hint="Liberadas y en taller"
          icon={Timer}
          tone="info"
        />
        <KpiCard
          label="Por aprobar"
          value={metrics.pendingApproval}
          hint="Esperan al Gerente"
          icon={ShieldCheck}
          tone="warning"
        />
        <KpiCard
          label="En calidad"
          value={metrics.inQuality}
          hint="Esperan visto bueno"
          icon={CheckCircle2}
          tone="warning"
        />
        <KpiCard
          label="Por entregar"
          value={metrics.readyForDelivery}
          hint="Listas para el cliente"
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {metrics.inQuality > 0 && (user.role === 'QUALITY' || user.role === 'ADMIN') && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
          <CheckCircle2 className="size-5 text-warning" />
          <p className="flex-1 text-foreground">
            Hay <strong>{metrics.inQuality}</strong> hoja(s) esperando el visto bueno
            de Calidad.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter('PENDING_QUALITY_APPROVAL')}
          >
            Ver en calidad
          </Button>
        </div>
      )}

      {routesQuery.isLoading ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Cargando hojas de ruta…
        </p>
      ) : routesQuery.isError ? (
        <EmptyState
          icon={FolderKanban}
          title="No se pudieron cargar las hojas de ruta"
          description="Revisa la conexión con la API e inténtalo de nuevo."
        />
      ) : (
        <DataTable
          data={routes}
          columns={columns}
          getRowId={(route) => route.id}
          search={{
            placeholder: 'Buscar por hoja, ODS, cliente, equipo o proceso…',
            getText: (route) =>
              `${route.code} ${route.serviceOrder.orderNumber} ${route.serviceOrder.clientName} ${route.serviceOrder.equipmentName} ${route.serviceOrder.equipmentCode} ${route.activeProcess?.name ?? ''}`,
          }}
          filters={
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger size="sm" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(ROUTE_SHEET_STATUS_META).map(([status, meta]) => (
                  <SelectItem key={status} value={status}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          actions={[
            {
              label: 'Ver hoja',
              icon: Eye,
              onSelect: (route) => navigate(`/hojas-de-ruta/${route.id}`),
            },
            {
              label: 'Editar',
              icon: Pencil,
              hidden: (route) =>
                !canManageRoutes(user) || route.status !== 'DRAFT',
              onSelect: (route) => navigate(`/hojas-de-ruta/nueva?id=${route.id}`),
            },
          ]}
          onRowClick={(route) => navigate(`/hojas-de-ruta/${route.id}`)}
          pageSize={10}
          emptyTitle="Sin hojas de ruta"
          emptyDescription="Ingeniería puede crear una hoja desde una inspección aprobada."
          caption="Hojas de ruta"
        />
      )}
    </div>
  );
}
