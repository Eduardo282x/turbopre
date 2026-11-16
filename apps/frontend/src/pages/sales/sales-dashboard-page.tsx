import { Building2, CheckCircle2, Eye, Package, ShoppingCart, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ChartCard } from '@/components/charts/chart-card';
import { DonutChart } from '@/components/charts/donut-chart';
import { SimpleBarChart } from '@/components/charts/simple-bar-chart';
import { RouteStatusBadge } from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Button } from '@/components/ui/button';
import {
  getClientVolumeData,
  getRoutesWithRelations,
  getSalesStatusData,
} from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { RouteSheetWithRelations } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';
import { canDeliverRoute } from '@/lib/permissions';

export function SalesDashboardPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const deliverRouteSheet = usePreviewStore((state) => state.deliverRouteSheet);
  const navigate = useNavigate();
  const [delivering, setDelivering] = useState<RouteSheetWithRelations | null>(null);

  if (!user) return null;

  const routes = getRoutesWithRelations(db);
  const topClients = getClientVolumeData(db);
  const salesStatus = getSalesStatusData(db);
  const ready = routes.filter((route) => route.status === 'READY_FOR_DELIVERY');
  const delivered = routes.filter((route) => route.status === 'DELIVERED');
  const active = routes.filter((route) => ['IN_PROGRESS', 'IN_QUALITY'].includes(route.status));
  const salesRoutes = routes
    .filter((route) => ['IN_PROGRESS', 'IN_QUALITY', 'READY_FOR_DELIVERY'].includes(route.status))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const columns: DataTableColumn<RouteSheetWithRelations>[] = [
    {
      id: 'code',
      header: 'Hoja de ruta',
      cell: (route) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{route.code}</p>
          <p className="max-w-64 truncate text-xs text-muted-foreground">{route.component.name}</p>
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
      id: 'status',
      header: 'Estado',
      cell: (route) => <RouteStatusBadge status={route.status} />,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (route) => <ProgressBar value={route.progress} className="w-28" />,
      hideOnMobile: true,
    },
    {
      id: 'due',
      header: 'Entrega',
      cell: (route) => <span className="text-xs text-muted-foreground">{formatDate(route.dueDate)}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) => new Date(route.dueDate),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comercial"
        title="Panel de ventas"
        description="Consulta el avance de las hojas de ruta y confirma las entregas con los clientes."
        actions={
          <Button variant="outline" asChild>
            <Link to="/ventas/clientes">
              <Building2 /> Clientes
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Clientes" value={db.clients.length} hint="Cartera activa" icon={Building2} tone="accent" />
        <KpiCard label="En proceso" value={active.length} hint="Hojas en taller o calidad" icon={ShoppingCart} tone="info" />
        <KpiCard label="Por entregar" value={ready.length} hint="Aprobadas por calidad" icon={Truck} tone="warning" />
        <KpiCard label="Entregadas" value={delivered.length} hint="Compromisos cerrados" icon={CheckCircle2} tone="success" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Top clientes" description="Mayor volumen de hojas de ruta.">
          <SimpleBarChart data={topClients} horizontal height={280} valueLabel="Hojas" />
        </ChartCard>
        <ChartCard title="Estado de las hojas" description="Semáforo comercial de compromisos.">
          <DonutChart
            data={salesStatus}
            centerValue={salesStatus.reduce((sum, item) => sum + item.value, 0)}
            centerLabel="hojas"
            height={280}
          />
        </ChartCard>
      </div>

      <DataTable
        data={salesRoutes}
        columns={columns}
        getRowId={(route) => route.id}
        search={{
          placeholder: 'Buscar por código, componente o cliente…',
          getText: (route) => `${route.code} ${route.component.name} ${route.client?.name ?? ''}`,
        }}
        actions={[
          { label: 'Ver detalle', icon: Eye, onSelect: (route) => navigate(`/hojas-de-ruta/${route.id}`) },
          {
            label: 'Confirmar entrega',
            icon: Package,
            hidden: (route) => !canDeliverRoute(user, route),
            onSelect: (route) => setDelivering(route),
          },
        ]}
        onRowClick={(route) => navigate(`/hojas-de-ruta/${route.id}`)}
        pageSize={10}
        emptyTitle="Sin hojas comerciales"
        emptyDescription="Cuando existan hojas en ejecución o listas para entrega aparecerán aquí."
        caption="Seguimiento comercial de hojas de ruta"
      />

      <ConfirmDialog
        open={Boolean(delivering)}
        onOpenChange={(open) => {
          if (!open) setDelivering(null);
        }}
        title="Confirmar entrega"
        description={`¿Confirmas la entrega de ${delivering?.component.name ?? 'la hoja de ruta'} al cliente ${delivering?.client?.name ?? ''}?`}
        confirmLabel="Sí, entregar"
        onConfirm={() => {
          if (!delivering) return;
          deliverRouteSheet(delivering.id, user.id);
          toast.success(`${delivering.code} entregada`);
          setDelivering(null);
        }}
      />
    </div>
  );
}
