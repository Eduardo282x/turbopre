import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Eye, Pencil, Plus, Search, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  PriorityBadge,
  ServiceOrderStatusBadge,
} from '@/components/common/badges';
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
import { SERVICE_ORDER_STATUS_META } from '@/features/preview/config';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { useServiceOrders } from '@/hooks/use-commercial-data';
import { getApiErrorMessage } from '@/lib/api-error';
import { daysUntil, formatDate } from '@/lib/formatters';
import { canManageServiceOrders } from '@/lib/permissions';
import type { CreateServiceOrderInput, ServiceOrderRecord } from '@turbopre/shared';
import { serviceOrdersService } from '@/services/service-orders/service-orders.service';
import { ServiceOrderFormDialog } from './service-order-form-dialog';

export function ServiceOrdersPage() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const ordersQuery = useServiceOrders();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceOrderRecord | undefined>();

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

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateServiceOrderInput }) =>
      serviceOrdersService.update(id, input),
    onSuccess: (order) => {
      invalidate();
      void queryClient.invalidateQueries({
        queryKey: ['service-orders', 'detail', order.id],
      });
      toast.success('Orden de servicio actualizada', {
        description: order.orderNumber,
      });
      setFormOpen(false);
    },
    onError: (error) =>
      toast.error('No se pudo actualizar la orden de servicio', {
        description: getApiErrorMessage(error),
      }),
  });

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const filtered = useMemo(
    () =>
      orders.filter(
        (order) => statusFilter === 'all' || order.workflowStatus === statusFilter,
      ),
    [orders, statusFilter],
  );

  if (!user) return null;

  const metrics = {
    total: orders.length,
    inInspection: orders.filter((order) => order.workflowStatus === 'IN_INSPECTION').length,
    inExecution: orders.filter((order) => order.workflowStatus === 'IN_EXECUTION').length,
    delivered: orders.filter((order) => order.workflowStatus === 'DELIVERED').length,
    critical: orders.filter(
      (order) =>
        order.priority === 'CRITICAL' &&
        !['DELIVERED', 'CANCELLED'].includes(order.workflowStatus),
    ).length,
  };

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
      id: 'description',
      header: 'Descripción',
      cell: (order) => (
        <span className="block max-w-80 truncate text-xs text-muted-foreground">
          {order.description}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (order) => <ServiceOrderStatusBadge status={order.workflowStatus} />,
      sortable: true,
      sortValue: (order) => order.workflowStatus,
    },
    {
      id: 'priority',
      header: 'Prioridad',
      cell: (order) => <PriorityBadge priority={order.priority} />,
      hideOnMobile: true,
    },
    {
      id: 'due',
      header: 'Entrega',
      cell: (order) => {
        if (!order.dueAt) {
          return <span className="text-xs text-muted-foreground">Sin fecha</span>;
        }

        const days = daysUntil(order.dueAt);
        return (
          <div className="text-xs">
            <p className="text-foreground">{formatDate(order.dueAt)}</p>
            <p
              className={
                days < 0
                  ? 'text-destructive'
                  : days <= 3
                    ? 'text-warning'
                    : 'text-muted-foreground'
              }
            >
              {days < 0 ? `${Math.abs(days)} días de retraso` : `En ${days} días`}
            </p>
          </div>
        );
      },
      hideOnMobile: true,
      sortable: true,
      sortValue: (order) => (order.dueAt ? new Date(order.dueAt) : null),
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (order) => <ProgressBar value={order.progress} className="w-28" showValue />,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ventas y taller"
        title="Órdenes de servicio"
        description="La ODS es el punto de partida: cliente, sitio, equipo, descripción, alcance, prioridad y fecha."
        actions={
          canManageServiceOrders(user) ? (
            <Button
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              <Plus /> Nueva orden de servicio
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Órdenes totales"
          value={metrics.total}
          hint="Recibidas por el sistema"
          icon={ClipboardList}
          tone="accent"
        />
        <KpiCard
          label="En inspección"
          value={metrics.inInspection}
          hint="Taller está evaluando"
          icon={Search}
          tone="info"
        />
        <KpiCard
          label="En ejecución"
          value={metrics.inExecution}
          hint="Hojas liberadas a taller"
          icon={Truck}
          tone="warning"
        />
        <KpiCard
          label="Entregadas"
          value={metrics.delivered}
          hint="Compromisos cerrados"
          icon={ClipboardList}
          tone="success"
        />
      </div>

      {ordersQuery.isError && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {getApiErrorMessage(ordersQuery.error, 'No se pudieron cargar las órdenes')}
        </p>
      )}

      <DataTable
        data={filtered}
        columns={columns}
        getRowId={(order) => order.id}
        isLoading={ordersQuery.isLoading}
        search={{
          placeholder: 'Buscar por ODS, cliente, equipo o descripción…',
          getText: (order) =>
            `${order.orderNumber} ${order.client.name} ${order.equipment.code} ${order.equipment.name} ${order.description}`,
        }}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger size="sm" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(SERVICE_ORDER_STATUS_META).map(([status, meta]) => (
                <SelectItem key={status} value={status}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        actions={[
          {
            label: 'Ver detalle',
            icon: Eye,
            onSelect: (order) => navigate(`/ordenes-servicio/${order.id}`),
          },
          {
            label: 'Editar',
            icon: Pencil,
            hidden: (order) =>
              !canManageServiceOrders(user) ||
              (user.role !== 'ADMIN' && Boolean(order.inspectionId || order.routeSheetId)),
            onSelect: (order) => {
              setEditing(order);
              setFormOpen(true);
            },
          },
        ]}
        onRowClick={(order) => navigate(`/ordenes-servicio/${order.id}`)}
        pageSize={10}
        emptyTitle="Sin órdenes de servicio"
        emptyDescription="Ventas puede crear la primera ODS desde este listado."
        caption="Órdenes de servicio"
      />

      <ServiceOrderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        order={editing}
        pending={createMutation.isPending || updateMutation.isPending}
        onSubmit={(input) => {
          if (editing) {
            updateMutation.mutate({ id: editing.id, input });
          } else {
            createMutation.mutate(input);
          }
        }}
      />
    </div>
  );
}
