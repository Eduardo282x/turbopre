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
import { getServiceOrdersWithRelations, getServiceOrderMetrics } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { NewServiceOrderInput, ServiceOrder, ServiceOrderWithRelations } from '@/features/preview/types';
import { daysUntil, formatDate } from '@/lib/formatters';
import { canManageServiceOrders } from '@/lib/permissions';
import { ServiceOrderFormDialog } from './service-order-form-dialog';

export function ServiceOrdersPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const createServiceOrder = usePreviewStore((state) => state.createServiceOrder);
  const updateServiceOrder = usePreviewStore((state) => state.updateServiceOrder);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceOrder | undefined>();

  const orders = getServiceOrdersWithRelations(db);
  const filtered = useMemo(
    () => orders.filter((order) => statusFilter === 'all' || order.status === statusFilter),
    [orders, statusFilter],
  );

  if (!user) return null;

  const metrics = getServiceOrderMetrics(db);

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
          <p className="text-muted-foreground">
            {order.asset?.manufacturer} {order.asset?.model} · {order.equipmentCode}
          </p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'description',
      header: 'Descripción',
      cell: (order) => (
        <span className="block max-w-80 truncate text-xs text-muted-foreground">{order.description}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (order) => <ServiceOrderStatusBadge status={order.status} />,
      sortable: true,
      sortValue: (order) => order.status,
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
        const days = daysUntil(order.dueDate);
        return (
          <div className="text-xs">
            <p className="text-foreground">{formatDate(order.dueDate)}</p>
            <p className={days < 0 ? 'text-destructive' : days <= 3 ? 'text-warning' : 'text-muted-foreground'}>
              {days < 0 ? `${Math.abs(days)} días de retraso` : `En ${days} días`}
            </p>
          </div>
        );
      },
      hideOnMobile: true,
      sortable: true,
      sortValue: (order) => new Date(order.dueDate),
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
        description="La ODS es el punto de partida: cliente, equipo, descripción, alcance, prioridad, fecha y sitio."
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
        <KpiCard label="Órdenes totales" value={metrics.total} hint="Recibidas por el sistema" icon={ClipboardList} tone="accent" />
        <KpiCard label="En inspección" value={metrics.inInspection} hint="Taller está evaluando" icon={Search} tone="info" />
        <KpiCard label="En ejecución" value={metrics.inExecution} hint="Hojas liberadas a taller" icon={Truck} tone="warning" />
        <KpiCard label="Entregadas" value={metrics.delivered} hint="Compromisos cerrados" icon={ClipboardList} tone="success" />
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        getRowId={(order) => order.id}
        search={{
          placeholder: 'Buscar por ODS, cliente, equipo o descripción…',
          getText: (order) =>
            `${order.code} ${order.subCode} ${order.client?.name ?? ''} ${order.asset?.model ?? ''} ${order.description}`,
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
              (user.role !== 'GLOBAL' && Boolean(order.inspectionId || order.routeSheetId)),
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
        onSubmit={(input: NewServiceOrderInput) => {
          if (editing) {
            updateServiceOrder(editing.id, input, user.id);
            toast.success('Orden de servicio actualizada');
          } else {
            const id = createServiceOrder(input, user.id);
            toast.success('Orden de servicio creada y enviada a taller e ingeniería');
            navigate(`/ordenes-servicio/${id}`);
          }
        }}
      />
    </div>
  );
}
