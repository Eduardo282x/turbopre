import { CheckCircle2, Eye, FolderKanban, Pencil, Plus, ShieldCheck, Timer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PriorityBadge, RouteStatusBadge } from '@/components/common/badges';
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
import { ROUTE_STATUS_META } from '@/features/preview/config';
import { getRouteMetrics, getRouteSheetsWithRelations } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { RouteSheetWithRelations } from '@/features/preview/types';
import { daysUntil, formatDate } from '@/lib/formatters';
import { canManageRoutes } from '@/lib/permissions';

export function RouteSheetsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');

  const routes = getRouteSheetsWithRelations(db);
  const filtered = useMemo(
    () => routes.filter((route) => statusFilter === 'all' || route.status === statusFilter),
    [routes, statusFilter],
  );

  if (!user) return null;

  const metrics = getRouteMetrics(db);

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
      id: 'status',
      header: 'Estado',
      cell: (route) => <RouteStatusBadge status={route.status} />,
      sortable: true,
      sortValue: (route) => route.status,
    },
    {
      id: 'priority',
      header: 'Prioridad',
      cell: (route) => <PriorityBadge priority={route.priority} />,
      hideOnMobile: true,
    },
    {
      id: 'stage',
      header: 'Etapa actual',
      cell: (route) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">Etapa {route.currentStage ?? '—'}</p>
          <p className="text-muted-foreground">{route.activeProcess?.shortName ?? 'Sin proceso activo'}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (route) => <ProgressBar value={route.progress} className="w-28" showValue />,
      hideOnMobile: true,
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
        <KpiCard label="Hojas totales" value={metrics.total} hint="Órdenes con plan de trabajo" icon={FolderKanban} tone="accent" />
        <KpiCard label="En ejecución" value={metrics.active} hint="Aprobadas y en taller" icon={Timer} tone="info" />
        <KpiCard label="Por aprobar" value={metrics.pendingApproval} hint="Esperan al Gerente" icon={ShieldCheck} tone="warning" />
        <KpiCard label="En calidad" value={metrics.inQuality} hint="Esperan visto bueno" icon={CheckCircle2} tone="warning" />
        <KpiCard label="Por entregar" value={metrics.readyForDelivery} hint="Listas para el cliente" icon={CheckCircle2} tone="success" />
      </div>

      {metrics.inQuality > 0 && (user.role === 'QUALITY' || user.role === 'GLOBAL') && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
          <CheckCircle2 className="size-5 text-warning" />
          <p className="flex-1 text-foreground">
            Hay <strong>{metrics.inQuality}</strong> hoja(s) esperando el visto bueno de Calidad.
          </p>
          <Button variant="outline" size="sm" onClick={() => setStatusFilter('IN_QUALITY')}>
            Ver en calidad
          </Button>
        </div>
      )}

      <DataTable
        data={filtered}
        columns={columns}
        getRowId={(route) => route.id}
        search={{
          placeholder: 'Buscar por hoja, ODS, cliente, equipo o proceso…',
          getText: (route) =>
            `${route.code} ${route.serviceOrder.code} ${route.serviceOrder.subCode} ${route.client?.name ?? ''} ${route.asset?.model ?? ''} ${route.activeProcess?.name ?? ''}`,
        }}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger size="sm" className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(ROUTE_STATUS_META).map(([status, meta]) => (
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
            hidden: (route) => !canManageRoutes(user) || !['DRAFT', 'IN_ANNEXES', 'IN_QUALITY'].includes(route.status),
            onSelect: (route) => navigate(`/hojas-de-ruta/nueva?id=${route.id}`),
          },
        ]}
        onRowClick={(route) => navigate(`/hojas-de-ruta/${route.id}`)}
        pageSize={10}
        emptyTitle="Sin hojas de ruta"
        emptyDescription="Ingeniería puede crear una hoja desde una inspección aprobada."
        caption="Hojas de ruta"
      />
    </div>
  );
}
