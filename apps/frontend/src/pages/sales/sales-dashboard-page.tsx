import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Eye,
  Package,
  Plus,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ChartCard } from '@/components/charts/chart-card';
import { DonutChart } from '@/components/charts/donut-chart';
import { SimpleBarChart } from '@/components/charts/simple-bar-chart';
import {
  PriorityBadge,
  RouteStatusBadge,
  ServiceOrderStatusBadge,
} from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { SectionCard } from '@/components/common/section-card';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Button } from '@/components/ui/button';
import {
  getClientVolumeData,
  getRouteSheetsWithRelations,
  getSalesStatusData,
  getServiceOrderMetrics,
  getServiceOrdersWithRelations,
} from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type {
  NewServiceOrderInput,
  RouteSheetWithRelations,
  ServiceOrderWithRelations,
} from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';
import { canDeliverRoute, canManageServiceOrders } from '@/lib/permissions';
import { ServiceOrderFormDialog } from '@/pages/service-orders/service-order-form-dialog';

export function SalesDashboardPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const createServiceOrder = usePreviewStore((state) => state.createServiceOrder);
  const deliverRouteSheet = usePreviewStore((state) => state.deliverRouteSheet);
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [delivering, setDelivering] = useState<RouteSheetWithRelations | null>(null);

  if (!user) return null;

  const orders = getServiceOrdersWithRelations(db);
  const routes = getRouteSheetsWithRelations(db);
  const metrics = getServiceOrderMetrics(db);
  const topClients = getClientVolumeData(db);
  const salesStatus = getSalesStatusData(db);
  const ready = routes.filter((route) => route.status === 'READY_FOR_DELIVERY');

  const columns: DataTableColumn<ServiceOrderWithRelations>[] = [
    {
      id: 'order',
      header: 'Orden de servicio',
      cell: (order) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{order.code}</p>
          <p className="font-mono text-[11px] text-muted-foreground">Sub-ODS: {order.subCode}</p>
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
          <p className="font-medium text-foreground">{order.client?.name ?? '—'}</p>
          <p className="text-muted-foreground">{order.asset?.manufacturer} {order.asset?.model}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (order) => <ServiceOrderStatusBadge status={order.status} />,
    },
    {
      id: 'priority',
      header: 'Prioridad',
      cell: (order) => <PriorityBadge priority={order.priority} />,
      hideOnMobile: true,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (order) => <ProgressBar value={order.progress} className="w-28" showValue />,
      hideOnMobile: true,
    },
    {
      id: 'due',
      header: 'Entrega',
      cell: (order) => <span className="text-xs text-muted-foreground">{formatDate(order.dueDate)}</span>,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comercial"
        title="Panel de ventas"
        description="Órdenes de servicio, compromisos de entrega y estado de los clientes."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/ventas/clientes">
                <Building2 /> Clientes
              </Link>
            </Button>
            {canManageServiceOrders(user) && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus /> Nueva orden de servicio
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Órdenes totales" value={metrics.total} hint="Recibidas por Ventas" icon={ClipboardList} tone="accent" />
        <KpiCard label="En inspección" value={metrics.inInspection} hint="Taller está evaluando" icon={ShoppingCart} tone="info" />
        <KpiCard label="En ejecución" value={metrics.inExecution} hint="Hojas liberadas" icon={Truck} tone="warning" />
        <KpiCard label="Por entregar" value={ready.length} hint="Listas para el cliente" icon={Package} tone="success" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Estado de las órdenes" description="Semáforo comercial de compromisos.">
          <DonutChart
            data={salesStatus}
            centerValue={salesStatus.reduce((sum, item) => sum + item.value, 0)}
            centerLabel="órdenes"
            height={280}
          />
        </ChartCard>
        <ChartCard title="Top clientes" description="Mayor volumen de órdenes de servicio.">
          <SimpleBarChart data={topClients} horizontal height={280} valueLabel="ODS" />
        </ChartCard>
      </div>

      {ready.length > 0 && (
        <SectionCard title="Listas para entregar" description="Hojas aprobadas por Calidad. Ventas confirma la entrega.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ready.map((route) => (
              <div key={route.id} className="rounded-xl border border-border/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{route.code}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {route.client?.name} · {route.asset?.model}
                    </p>
                  </div>
                  <RouteStatusBadge status={route.status} />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Entrega comprometida: {formatDate(route.dueDate)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/hojas-de-ruta/${route.id}`}>
                      <Eye /> Ver
                    </Link>
                  </Button>
                  {canDeliverRoute(user, route) && (
                    <Button size="sm" onClick={() => setDelivering(route)}>
                      <Package /> Entregar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Órdenes de servicio" description="Seguimiento comercial de todas las ODS." contentClassName="p-0">
        <DataTable
          data={orders}
          columns={columns}
          getRowId={(order) => order.id}
          search={{
            placeholder: 'Buscar por ODS, cliente, equipo o descripción…',
            getText: (order) =>
              `${order.code} ${order.subCode} ${order.client?.name ?? ''} ${order.asset?.model ?? ''} ${order.description}`,
          }}
          onRowClick={(order) => navigate(`/ordenes-servicio/${order.id}`)}
          pageSize={10}
          emptyTitle="Sin órdenes de servicio"
          emptyDescription="Crea la primera ODS para iniciar el flujo."
          caption="Órdenes de servicio"
        />
      </SectionCard>

      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 p-3 text-xs text-muted-foreground">
        <CheckCircle2 className="size-4 shrink-0 text-success" />
        <p>
          Al crear una ODS, Taller e Ingeniería la reciben automáticamente. No hay que enviarla manualmente.
        </p>
      </div>

      <ServiceOrderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(input: NewServiceOrderInput) => {
          const id = createServiceOrder(input, user.id);
          toast.success('Orden de servicio creada y enviada a taller e ingeniería');
          navigate(`/ordenes-servicio/${id}`);
        }}
      />

      <ConfirmDialog
        open={Boolean(delivering)}
        onOpenChange={(open) => {
          if (!open) setDelivering(null);
        }}
        title="Confirmar entrega"
        description={`¿Confirmas la entrega de ${delivering?.code ?? 'la hoja'} al cliente ${delivering?.client?.name ?? ''}?`}
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
