import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { useServiceOrders } from '@/hooks/use-commercial-data';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/formatters';
import { canManageServiceOrders } from '@/lib/permissions';
import type { CreateServiceOrderInput, ServiceOrderRecord } from '@turbopre/shared';
import { serviceOrdersService } from '@/services/service-orders/service-orders.service';
import { ServiceOrderFormDialog } from '@/pages/service-orders/service-order-form-dialog';

const SALES_STATUS = [
  { name: 'Recibidas', color: '#64748b', matches: ['RECEIVED'] },
  { name: 'En inspección', color: '#38bdf8', matches: ['IN_INSPECTION'] },
  { name: 'En hoja de ruta', color: '#a78bfa', matches: ['INSPECTION_APPROVED', 'IN_ROUTE'] },
  { name: 'En ejecución', color: '#00d1ff', matches: ['IN_EXECUTION'] },
  { name: 'En calidad', color: '#ffb020', matches: ['IN_ANNEXES', 'IN_QUALITY'] },
  { name: 'Por entregar', color: '#22c55e', matches: ['READY_FOR_DELIVERY'] },
  { name: 'Entregadas', color: '#3b82f6', matches: ['DELIVERED'] },
] as const;

export function SalesDashboardPage() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const ordersQuery = useServiceOrders();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [delivering, setDelivering] = useState<ServiceOrderRecord | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    void queryClient.invalidateQueries({ queryKey: ['clients'] });
    void queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const createMutation = useMutation({
    mutationFn: (input: CreateServiceOrderInput) => serviceOrdersService.create(input),
    onSuccess: (order) => {
      invalidate();
      toast.success('Orden de servicio creada y enviada a taller e ingeniería', {
        description: order.orderNumber,
      });
      setFormOpen(false);
      navigate(`/ordenes-servicio/${order.id}`);
    },
    onError: (error) =>
      toast.error('No se pudo crear la orden de servicio', {
        description: getApiErrorMessage(error),
      }),
  });

  const deliverMutation = useMutation({
    mutationFn: (id: string) => serviceOrdersService.deliver(id),
    onSuccess: (order) => {
      invalidate();
      toast.success('Entrega registrada', { description: order.orderNumber });
      setDelivering(null);
    },
    onError: (error) =>
      toast.error('No se pudo registrar la entrega', {
        description: getApiErrorMessage(error),
      }),
  });

  if (!user) return null;

  const orders = ordersQuery.data ?? [];
  const ready = orders.filter((order) => order.status === 'READY_FOR_DELIVERY');
  const metrics = {
    total: orders.length,
    inInspection: orders.filter((order) => order.workflowStatus === 'IN_INSPECTION').length,
    inExecution: orders.filter((order) => order.workflowStatus === 'IN_EXECUTION').length,
    readyForDelivery: ready.length,
    delivered: orders.filter((order) => order.workflowStatus === 'DELIVERED').length,
  };

  const salesStatus = SALES_STATUS.map((status) => ({
    name: status.name,
    color: status.color,
    value: orders.filter((order) =>
      (status.matches as readonly string[]).includes(order.workflowStatus),
    ).length,
  }));

  const topClients = Object.values(
    orders.reduce<Record<string, { clientId: string; name: string; value: number }>>(
      (accumulator, order) => {
        const current = accumulator[order.client.id] ?? {
          clientId: order.client.id,
          name: order.client.name,
          value: 0,
        };
        current.value += 1;
        accumulator[order.client.id] = current;
        return accumulator;
      },
      {},
    ),
  )
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const columns: DataTableColumn<ServiceOrderRecord>[] = [
    {
      id: 'order',
      header: 'Orden de servicio',
      cell: (order) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{order.orderNumber}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {order.parentOrderNumber
              ? `Sub-ODS de ${order.parentOrderNumber}`
              : 'ODS principal'}
          </p>
        </div>
      ),
      sortable: true,
      sortValue: (order) => order.orderNumber,
    },
    {
      id: 'client',
      header: 'Cliente / equipo',
      cell: (order) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{order.client.name}</p>
          <p className="text-muted-foreground">
            {order.equipment.code} · {order.equipment.name}
          </p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (order) => <ServiceOrderStatusBadge status={order.workflowStatus} />,
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
      cell: (order) => (
        <span className="text-xs text-muted-foreground">
          {order.dueAt ? formatDate(order.dueAt) : 'Sin fecha'}
        </span>
      ),
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
        <KpiCard
          label="Órdenes totales"
          value={metrics.total}
          hint="Recibidas por Ventas"
          icon={ClipboardList}
          tone="accent"
        />
        <KpiCard
          label="En inspección"
          value={metrics.inInspection}
          hint="Taller está evaluando"
          icon={ShoppingCart}
          tone="info"
        />
        <KpiCard
          label="En ejecución"
          value={metrics.inExecution}
          hint="Hojas liberadas"
          icon={Truck}
          tone="warning"
        />
        <KpiCard
          label="Por entregar"
          value={metrics.readyForDelivery}
          hint="Listas para el cliente"
          icon={Package}
          tone="success"
        />
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
        <SectionCard
          title="Listas para entregar"
          description="ODS pendientes de confirmación de entrega por Ventas."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ready.map((order) => (
              <div key={order.id} className="rounded-xl border border-border/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{order.orderNumber}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.client.name} · {order.equipment.name}
                    </p>
                  </div>
                  <ServiceOrderStatusBadge status={order.workflowStatus} />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Entrega comprometida: {order.dueAt ? formatDate(order.dueAt) : 'Sin fecha'}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/ordenes-servicio/${order.id}`}>
                      <Eye /> Ver
                    </Link>
                  </Button>
                  {canManageServiceOrders(user) && (
                    <Button size="sm" onClick={() => setDelivering(order)}>
                      <Package /> Entregar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Órdenes de servicio"
        description="Seguimiento comercial de todas las ODS."
        contentClassName="p-0"
      >
        <DataTable
          data={orders}
          columns={columns}
          getRowId={(order) => order.id}
          isLoading={ordersQuery.isLoading}
          search={{
            placeholder: 'Buscar por ODS, cliente, equipo o descripción…',
            getText: (order) =>
              `${order.orderNumber} ${order.client.name} ${order.equipment.code} ${order.equipment.name} ${order.description}`,
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
        pending={createMutation.isPending}
        onSubmit={(input) => createMutation.mutate(input)}
      />

      <ConfirmDialog
        open={Boolean(delivering)}
        onOpenChange={(open) => {
          if (!open) setDelivering(null);
        }}
        title="Confirmar entrega"
        description={`¿Confirmas la entrega de ${delivering?.orderNumber ?? 'la ODS'} al cliente ${delivering?.client.name ?? ''}?`}
        confirmLabel="Sí, entregar"
        onConfirm={() => {
          if (!delivering) return;
          deliverMutation.mutate(delivering.id);
        }}
      />
    </div>
  );
}
