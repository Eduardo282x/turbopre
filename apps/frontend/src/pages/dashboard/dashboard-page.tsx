import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileText,
  Plus,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ChartCard } from '@/components/charts/chart-card';
import { DonutChart } from '@/components/charts/donut-chart';
import { SimpleBarChart } from '@/components/charts/simple-bar-chart';
import {
  PriorityBadge,
  RouteStatusBadge,
  ServiceOrderStatusBadge,
} from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { SectionCard } from '@/components/common/section-card';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  getApprovedInspectionsWithoutRoute,
  getInspectionMetrics,
  getMyTasks,
  getPendingApprovals,
  getProcessWorkloadData,
  getQualityQueue,
  getRouteMetrics,
  getRouteStatusChartData,
  getServiceOrderMetrics,
  getServiceOrdersWithRelations,
  getUpcomingDeliveries,
} from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { RouteSheetWithRelations, ServiceOrderWithRelations } from '@/features/preview/types';
import { daysUntil, formatDate } from '@/lib/formatters';
import { canManageRoutes } from '@/lib/permissions';

const rolePrompts = {
  GLOBAL: {
    title: 'Visión global del sistema',
    description: 'Todas las órdenes, inspecciones y hojas de ruta en un solo lugar.',
    action: 'Ver órdenes de servicio',
    to: '/ordenes-servicio',
  },
  WORKSHOP: {
    title: 'Coordinación de taller',
    description: 'Recibe las ODS, crea inspecciones y aprueba su alcance antes de Ingeniería.',
    action: 'Ver inspecciones',
    to: '/taller/inspecciones',
  },
  ENGINEERING: {
    title: 'Ingeniería y soporte técnico',
    description: 'Crea hojas de ruta desde inspecciones aprobadas y coordina la ejecución técnica.',
    action: 'Ver inspecciones aprobadas',
    to: '/taller/inspecciones',
  },
  OPERATOR: {
    title: 'Tus tareas de taller',
    description: 'Abre la hoja completa y marca solo las tareas de tu puesto y etapa activa.',
    action: 'Ver mis tareas',
    to: '/mis-tareas',
  },
  QUALITY: {
    title: 'Calidad en la hoja de ruta',
    description: 'Ejecuta tus tareas, revisa anexos y da el visto bueno final.',
    action: 'Ver hojas en calidad',
    to: '/hojas-de-ruta',
  },
  PROJECT: {
    title: 'Aprobación y seguimiento',
    description: 'Aprueba las hojas antes de liberarlas y sigue el rendimiento de la planta.',
    action: 'Ver aprobaciones',
    to: '/aprobaciones',
  },
} as const;

export function DashboardPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const navigate = useNavigate();

  if (!user) return null;
  if (user.role === 'SALES') return <Navigate to="/ventas" replace />;
  if (user.role === 'WAREHOUSE') return <Navigate to="/almacen/inventario" replace />;

  const routeMetrics = getRouteMetrics(db);
  const orderMetrics = getServiceOrderMetrics(db);
  const inspectionMetrics = getInspectionMetrics(db);
  const statusData = getRouteStatusChartData(db);
  const workload = getProcessWorkloadData(db).filter((item) => item.value > 0);
  const recentOrders = getServiceOrdersWithRelations(db)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const upcoming = getUpcomingDeliveries(db);
  const myTasks = getMyTasks(db, user);
  const approvals = getPendingApprovals(db);
  const qualityQueue = getQualityQueue(db);
  const approvedInspections = getApprovedInspectionsWithoutRoute(db);
  const prompt = rolePrompts[user.role as keyof typeof rolePrompts];

  const orderColumns: DataTableColumn<ServiceOrderWithRelations>[] = [
    {
      id: 'order',
      header: 'Orden de servicio',
      cell: (order) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{order.code}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{order.subCode}</p>
        </div>
      ),
      sortable: true,
      sortValue: (order) => order.code,
    },
    {
      id: 'client',
      header: 'Cliente / equipo',
      cell: (order) => (
        <div className="text-xs">
          <p className="text-foreground">{order.client?.name ?? '—'}</p>
          <p className="text-muted-foreground">{order.asset?.manufacturer} {order.asset?.model}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (order) => <ServiceOrderStatusBadge status={order.status} />,
      hideOnMobile: true,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (order) => <ProgressBar value={order.progress} className="w-28" />,
      hideOnMobile: true,
    },
  ];

  const routeColumns: DataTableColumn<RouteSheetWithRelations>[] = [
    {
      id: 'route',
      header: 'Hoja de ruta',
      cell: (route) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{route.code}</p>
          <p className="truncate text-xs text-muted-foreground">{route.asset?.model}</p>
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
      id: 'priority',
      header: 'Prioridad',
      cell: (route) => <PriorityBadge priority={route.priority} />,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Hola, ${user.name.split(' ')[0]}`}
        title="Centro de control"
        description="Visión general de órdenes de servicio, inspecciones, hojas de ruta y compromisos de entrega."
        actions={
          <>
            {user.role === 'ENGINEERING' && canManageRoutes(user) && (
              <Button asChild>
                <Link to="/hojas-de-ruta/nueva">
                  <Plus /> Nueva hoja de ruta
                </Link>
              </Button>
            )}
            {(user.role === 'OPERATOR' || user.role === 'QUALITY' || user.role === 'ENGINEERING') && (
              <Button variant="outline" asChild>
                <Link to="/mis-tareas">
                  <ClipboardList /> Mis tareas
                </Link>
              </Button>
            )}
            {user.role === 'PROJECT' && (
              <Button asChild>
                <Link to="/aprobaciones">
                  <BadgeCheck /> Aprobaciones
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Órdenes de servicio" value={orderMetrics.total} hint="Recibidas de Ventas" icon={ClipboardList} tone="accent" />
        <KpiCard label="Hojas activas" value={routeMetrics.active} hint="Aprobadas, en taller o calidad" icon={Activity} tone="info" />
        <KpiCard label="En calidad" value={routeMetrics.inQuality} hint="Pendientes de visto bueno" icon={Clock3} tone="warning" />
        <KpiCard label="Entregadas" value={routeMetrics.delivered} hint="Compromisos cerrados" icon={CheckCircle2} tone="success" />
      </div>

      {routeMetrics.critical > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 py-0">
          <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <TriangleAlert className="size-5 text-destructive" />
            <p className="flex-1 text-foreground">
              Hay <strong>{routeMetrics.critical}</strong> hoja(s) con prioridad crítica sin entregar.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/hojas-de-ruta">Revisar prioridades</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-[0.6fr_1.4fr]">
        <ChartCard title="Hojas por estado" description="Distribución del ciclo de vida.">
          <DonutChart data={statusData} centerValue={routeMetrics.total} centerLabel="hojas" height={260} />
        </ChartCard>
        <SectionCard title="Últimas órdenes de servicio" description="Actividad reciente de Ventas." contentClassName="p-0">
          <DataTable
            data={recentOrders}
            columns={orderColumns}
            getRowId={(order) => order.id}
            pageSize={5}
            pageSizeOptions={[5, 10]}
            onRowClick={(order) => navigate(`/ordenes-servicio/${order.id}`)}
            emptyTitle="Sin órdenes"
            emptyDescription="Ventas aún no ha creado órdenes de servicio."
            caption="Últimas órdenes de servicio"
          />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Carga por proceso" description="Tareas pendientes o en proceso.">
          <SimpleBarChart data={workload} horizontal height={280} valueLabel="Tareas" />
        </ChartCard>
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
              {user.role === 'PROJECT' && <Badge variant="outline">{approvals.length} aprobaciones</Badge>}
              {(user.role === 'QUALITY' || user.role === 'GLOBAL') && <Badge variant="outline">{qualityQueue.length} en calidad</Badge>}
              {user.role === 'ENGINEERING' && (
                <Badge variant="outline">{approvedInspections.length} inspecciones sin hoja</Badge>
              )}
              {user.role === 'WORKSHOP' && (
                <Badge variant="outline">{inspectionMetrics.completed} inspecciones por aprobar</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link to={prompt.to}>
                {prompt.action} <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <SectionCard
        title="Próximas entregas"
        description="Hojas activas ordenadas por fecha compromiso."
        contentClassName="p-0"
      >
        <DataTable
          data={upcoming}
          columns={routeColumns}
          getRowId={(route) => route.id}
          pageSize={5}
          pageSizeOptions={[5, 10]}
          onRowClick={(route) => navigate(`/hojas-de-ruta/${route.id}`)}
          emptyTitle="Sin entregas próximas"
          emptyDescription="Cuando existan hojas activas aparecerán aquí."
          caption="Próximas entregas"
        />
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Inspecciones en curso', value: inspectionMetrics.inProgress, icon: ClipboardCheck, tone: 'info' as const },
          { label: 'Inspecciones por aprobar', value: inspectionMetrics.completed, icon: ShieldCheck, tone: 'warning' as const },
          { label: 'Hojas por aprobar', value: routeMetrics.pendingApproval, icon: BadgeCheck, tone: 'warning' as const },
          { label: 'Listas para entrega', value: routeMetrics.readyForDelivery, icon: FileText, tone: 'success' as const },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-border/70 bg-card/70 p-4">
              <Icon className="size-4 text-muted-foreground" />
              <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
