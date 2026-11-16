import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { ChartCard } from '@/components/charts/chart-card';
import { DonutChart } from '@/components/charts/donut-chart';
import { OperationsRadar, type OperationsRadarItem } from '@/components/charts/operations-radar';
import { SimpleBarChart } from '@/components/charts/simple-bar-chart';
import { RouteStatusBadge } from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { SectionCard } from '@/components/common/section-card';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AREA_BY_ID, ROUTE_STATUS_META } from '@/features/preview/config';
import {
  getAreaWorkloadData,
  getClientVolumeData,
  getMyTasks,
  getPendingApprovals,
  getQualityQueue,
  getRouteMetrics,
  getRoutesWithRelations,
  getSalesStatusData,
  getStatusChartData,
  getUpcomingDeliveries,
  getWarehouseRequests,
} from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { RouteSheetWithRelations } from '@/features/preview/types';
import { daysUntil, formatDate } from '@/lib/formatters';
import { canManageRoutes } from '@/lib/permissions';

const rolePrompts = {
  PLANNING: {
    title: 'Bandeja de planificación',
    description: 'Revisa las hojas en borrador y completa partes, fases y repuestos.',
    action: 'Ir a hojas de ruta',
    to: '/hojas-de-ruta',
  },
  ENGINEERING: {
    title: 'Aprobaciones técnicas',
    description: 'Hay hojas de ruta esperando revisión y liberación de Ingeniería.',
    action: 'Ver aprobaciones',
    to: '/aprobaciones',
  },
  WORKSHOP: {
    title: 'Coordinación de taller',
    description: 'Supervisa las inspecciones y la ejecución de las fases en las áreas.',
    action: 'Ver inspecciones',
    to: '/taller/inspecciones',
  },
  OPERATOR: {
    title: 'Tus tareas asignadas',
    description: 'Consulta las fases de tu área y registra el avance con evidencia.',
    action: 'Ver mis tareas',
    to: '/mis-tareas',
  },
  QUALITY: {
    title: 'Visto bueno de calidad',
    description: 'Hay expedientes pendientes de revisión final y liberación.',
    action: 'Ir a calidad',
    to: '/calidad/visto-bueno',
  },
  WAREHOUSE: {
    title: 'Solicitudes de almacén',
    description: 'Despacha repuestos y mantén actualizado el inventario del taller.',
    action: 'Ver solicitudes',
    to: '/almacen/solicitudes',
  },
  SALES: {
    title: 'Compromisos de entrega',
    description: 'Consulta las hojas listas para entrega y confirma con el cliente.',
    action: 'Ver panel de ventas',
    to: '/ventas',
  },
  GLOBAL: {
    title: 'Visión global',
    description: 'Todas las áreas, hojas de ruta y eventos del sistema en un solo lugar.',
    action: 'Ver auditoría',
    to: '/administracion/auditoria',
  },
} as const;

export function DashboardPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const navigate = useNavigate();

  if (!user) return null;

  const metrics = getRouteMetrics(db);
  const statusData = getStatusChartData(db);
  const areaWorkload = getAreaWorkloadData(db).filter((item) => item.value > 0);
  const topClients = getClientVolumeData(db);
  const salesStatus = getSalesStatusData(db);
  const upcoming = getUpcomingDeliveries(db);
  const activeRoutes = getRoutesWithRelations(db)
    .filter((route) => ['APPROVED', 'IN_PROGRESS', 'IN_QUALITY'].includes(route.status))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const myTasks = getMyTasks(db, user);
  const approvals = getPendingApprovals(db);
  const quality = getQualityQueue(db);
  const requests = getWarehouseRequests(db);

  const radarItems: OperationsRadarItem[] = activeRoutes.map((route) => {
    const currentPhase =
      route.phases.find((phase) => phase.status === 'IN_PROGRESS') ??
      route.phases.find((phase) => phase.status === 'PENDING');
    const responsible = db.users.find((candidate) => candidate.id === currentPhase?.responsibleId);
    const meta = ROUTE_STATUS_META[route.status];
    return {
      id: route.id,
      code: route.code,
      component: route.component.name,
      progress: route.progress,
      area: currentPhase ? AREA_BY_ID[currentPhase.areaId].shortName : 'Sin área',
      responsible: responsible?.name ?? 'Sin asignar',
      statusLabel: meta.shortLabel,
      tone: meta.tone,
    };
  });

  const prompt = rolePrompts[user.role];

  const columns: DataTableColumn<RouteSheetWithRelations>[] = [
    {
      id: 'route',
      header: 'Hoja de ruta',
      cell: (route) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{route.code}</p>
          <p className="truncate text-xs text-muted-foreground">{route.component.name}</p>
        </div>
      ),
      sortable: true,
      sortValue: (route) => route.code,
    },
    {
      id: 'client',
      header: 'Cliente',
      cell: (route) => <span className="text-sm">{route.client?.name ?? '—'}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) => route.client?.name ?? '',
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
      sortable: true,
      sortValue: (route) => new Date(route.dueDate),
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (route) => <RouteStatusBadge status={route.status} />,
      hideOnMobile: true,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (route) => <ProgressBar value={route.progress} className="w-28" showValue />,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Hola, ${user.name.split(' ')[0]}`}
        title="Centro de control"
        description="Resumen de hojas de ruta, carga por área y próximos compromisos de entrega."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/mis-tareas">
                <ClipboardList /> Mis tareas
              </Link>
            </Button>
            {canManageRoutes(user) && (
              <Button asChild>
                <Link to="/hojas-de-ruta?nueva=1">
                  <Plus /> Nueva hoja de ruta
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Hojas totales" value={metrics.total} hint="Expedientes en el sistema" icon={ClipboardList} tone="accent" />
        <KpiCard label="En proceso" value={metrics.active} hint="Aprobadas, en taller o calidad" icon={Activity} tone="info" />
        <KpiCard label="En calidad" value={metrics.inQuality} hint="Pendientes de visto bueno" icon={Clock3} tone="warning" />
        <KpiCard label="Entregadas" value={metrics.delivered} hint="Compromisos cerrados" icon={CheckCircle2} tone="success" />
      </div>

      {metrics.critical > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 py-0">
          <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <TriangleAlert className="size-5 text-destructive" />
            <p className="flex-1 text-foreground">
              Hay <strong>{metrics.critical}</strong> hoja(s) de ruta con prioridad crítica sin entregar.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/hojas-de-ruta">Revisar prioridades</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Flujo de hojas de ruta" description="Distribución por estado del ciclo de vida.">
          <SimpleBarChart data={statusData} horizontal valueLabel="Hojas" height={280} />
        </ChartCard>

        {user.role === 'SALES' ? (
          <ChartCard title="Estado de mis compromisos" description="Semáforo de entregas comerciales.">
            <DonutChart
              data={salesStatus}
              centerValue={salesStatus.reduce((sum, item) => sum + item.value, 0)}
              centerLabel="hojas"
              height={280}
            />
          </ChartCard>
        ) : (
          <ChartCard title="Carga por área" description="Fases pendientes o en proceso por área.">
            <DonutChart
              data={areaWorkload}
              centerValue={areaWorkload.reduce((sum, item) => sum + item.value, 0)}
              centerLabel="fases activas"
              height={280}
            />
          </ChartCard>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <ChartCard
          title="Radar de operaciones"
          description="¿Quién tiene la pelota en este momento?"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/hojas-de-ruta">
                Ver todas <ArrowRight />
              </Link>
            </Button>
          }
          empty={radarItems.length === 0}
          emptyMessage="No hay hojas de ruta activas en este momento."
        >
          <OperationsRadar items={radarItems} />
        </ChartCard>

        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5 py-0">
            <CardContent className="space-y-3 p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="font-heading text-sm font-semibold">{prompt.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{prompt.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{myTasks.length} tareas</Badge>
                {(user.role === 'ENGINEERING' || user.role === 'GLOBAL') && (
                  <Badge variant="outline">{approvals.length} aprobaciones</Badge>
                )}
                {(user.role === 'QUALITY' || user.role === 'GLOBAL') && (
                  <Badge variant="outline">{quality.length} en calidad</Badge>
                )}
                {(user.role === 'WAREHOUSE' || user.role === 'GLOBAL') && (
                  <Badge variant="outline">{requests.length} solicitudes</Badge>
                )}
              </div>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to={prompt.to}>
                  {prompt.action} <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {user.role === 'SALES' && (
            <ChartCard title="Top clientes" description="Mayor volumen de hojas de ruta.">
              <SimpleBarChart data={topClients} horizontal height={220} valueLabel="Hojas" />
            </ChartCard>
          )}
        </div>
      </div>

      <SectionCard
        title="Próximas entregas"
        description="Hojas de ruta activas ordenadas por fecha compromiso."
        contentClassName="p-0"
      >
        <DataTable
          data={upcoming}
          columns={columns}
          getRowId={(route) => route.id}
          pageSize={5}
          pageSizeOptions={[5, 10]}
          onRowClick={(route) => navigate(`/hojas-de-ruta/${route.id}`)}
          emptyTitle="Sin entregas próximas"
          emptyDescription="Cuando existan hojas de ruta activas aparecerán aquí."
          caption="Próximas entregas de hojas de ruta"
        />
      </SectionCard>
    </div>
  );
}
