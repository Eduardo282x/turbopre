import { Eye, Package, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ServiceModeBadge, ServiceOrderStatusBadge, SupplyStatusBadge } from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { getSupplyOrdersWithRelations } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { SupplyOrderWithRelations } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';
import { canManageSupply } from '@/lib/permissions';

const SUPPLY_ORDER: SupplyOrderWithRelations['status'][] = [
  'REQUESTED',
  'QUOTED',
  'PURCHASED',
  'INSPECTION',
  'DISPATCHED',
  'DELIVERED',
];

export function SupplyPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const updateSupplyStatus = usePreviewStore((state) => state.updateSupplyStatus);
  const navigate = useNavigate();
  const orders = getSupplyOrdersWithRelations(db);

  if (!user) return null;

  const columns: DataTableColumn<SupplyOrderWithRelations>[] = [
    {
      id: 'order',
      header: 'Expediente',
      cell: (order) => (
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">{order.serviceOrder.code}</p>
          <p className="text-xs text-muted-foreground">{order.client?.name} · {order.asset?.manufacturer} {order.asset?.model}</p>
          <div className="flex flex-wrap gap-1">
            <ServiceModeBadge mode="SUPPLY" />
            <ServiceOrderStatusBadge status={order.serviceOrder.status} />
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (order) => order.serviceOrder.code,
    },
    {
      id: 'items',
      header: 'Componentes',
      cell: (order) => (
        <ul className="max-w-64 space-y-1 text-xs">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="truncate text-foreground">{item.name}</span>
              <span className="text-muted-foreground">{item.quantity}×</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (order) => <SupplyStatusBadge status={order.status} />,
      sortable: true,
      sortValue: (order) => order.status,
    },
    {
      id: 'supplier',
      header: 'Proveedor / OC',
      cell: (order) => (
        <div className="text-xs">
          <p className="text-foreground">{order.supplier ?? 'Por definir'}</p>
          <p className="text-muted-foreground">{order.purchaseOrder ?? 'Sin OC'}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'dates',
      header: 'Fechas',
      cell: (order) => (
        <div className="text-xs text-muted-foreground">
          <p>Esperada: {order.expectedDate ? formatDate(order.expectedDate) : '—'}</p>
          <p>Entregada: {order.deliveredAt ? formatDate(order.deliveredAt) : '—'}</p>
        </div>
      ),
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Suministro"
        title="Componentes y sistemas"
        description="Cotización, compra, inspección y entrega de partes para turbinas, generadores y compresores."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Órdenes" value={orders.length} hint="Solicitudes de suministro" icon={ShoppingCart} tone="accent" />
        <KpiCard label="En procura" value={orders.filter((order) => ['REQUESTED', 'QUOTED', 'PURCHASED'].includes(order.status)).length} hint="Compra en curso" icon={Package} tone="warning" />
        <KpiCard label="Entregadas" value={orders.filter((order) => order.status === 'DELIVERED').length} hint="Componentes recibidos" icon={Eye} tone="success" />
      </div>

      <DataTable
        data={orders}
        columns={columns}
        getRowId={(order) => order.id}
        search={{
          placeholder: 'Buscar por expediente, cliente, componente o proveedor…',
          getText: (order) => `${order.serviceOrder.code} ${order.client?.name ?? ''} ${order.asset?.model ?? ''} ${order.supplier ?? ''} ${order.items.map((item) => item.name).join(' ')}`,
        }}
        actions={[
          { label: 'Ver expediente', icon: Eye, onSelect: (order) => navigate(`/expedientes/${order.serviceOrderId}`) },
          {
            label: 'Avanzar estado',
            icon: ShoppingCart,
            hidden: (order) => !canManageSupply(user) || order.status === 'DELIVERED',
            onSelect: (order) => {
              const index = SUPPLY_ORDER.indexOf(order.status);
              const nextStatus = SUPPLY_ORDER[Math.min(index + 1, SUPPLY_ORDER.length - 1)];
              updateSupplyStatus(order.id, nextStatus, user.id);
              toast.success('Suministro actualizado');
            },
          },
        ]}
        onRowClick={(order) => navigate(`/expedientes/${order.serviceOrderId}`)}
        pageSize={10}
        emptyTitle="Sin órdenes de suministro"
        emptyDescription="Crea un expediente en modo Suministro para iniciar."
        caption="Órdenes de suministro"
      />
    </div>
  );
}
