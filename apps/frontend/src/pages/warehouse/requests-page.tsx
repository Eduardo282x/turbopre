import { CheckCircle2, Package, ShoppingCart, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  SpareDestinationBadge,
  SpareItemStatusBadge,
} from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getProcurePendingItems,
  getWarehousePendingItems,
  type WarehouseItem,
} from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { formatDate } from '@/lib/formatters';

export function RequestsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const updateSpareItemStatus = usePreviewStore((state) => state.updateSpareItemStatus);
  const [destination, setDestination] = useState('all');

  const warehouse = getWarehousePendingItems(db);
  const procure = getProcurePendingItems(db);
  const rows = useMemo(
    () => [...warehouse, ...procure].filter((row) => destination === 'all' || row.item.destination === destination),
    [warehouse, procure, destination],
  );

  if (!user) return null;
  const dispatched = db.spareRequests.flatMap((request) => request.items).filter((item) => item.status === 'DISPATCHED').length;
  const received = db.spareRequests.flatMap((request) => request.items).filter((item) => item.status === 'RECEIVED').length;

  const columns: DataTableColumn<WarehouseItem>[] = [
    {
      id: 'request',
      header: 'Solicitud / hoja',
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{row.request.code}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{row.route?.code ?? '—'}</p>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.request.code,
    },
    {
      id: 'item',
      header: 'Repuesto / material',
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {row.item.quantity}× {row.item.name}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{row.item.code}</p>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.item.name,
    },
    {
      id: 'client',
      header: 'Cliente / equipo',
      cell: (row) => (
        <div className="text-xs">
          <p className="text-foreground">{row.serviceOrder ? db.clients.find((client) => client.id === row.serviceOrder?.clientId)?.name ?? '—' : '—'}</p>
          <p className="text-muted-foreground">{row.route?.equipmentCode ?? '—'}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'destination',
      header: 'Destino',
      cell: (row) => <SpareDestinationBadge destination={row.item.destination} />,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (row) => <SpareItemStatusBadge status={row.item.status} />,
      sortable: true,
      sortValue: (row) => row.item.status,
    },
    {
      id: 'date',
      header: 'Solicitada',
      cell: (row) => <span className="text-xs text-muted-foreground">{formatDate(row.request.requestedAt)}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (row) => new Date(row.request.requestedAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Almacén"
        title="Solicitudes de taller"
        description="Despacha materiales del inventario y registra la llegada de los ítems que van a Procura."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="En almacén" value={warehouse.length} hint="Por aprobar o despachar" icon={Package} tone="warning" />
        <KpiCard label="En procura" value={procure.length} hint="Esperando compra o recepción" icon={ShoppingCart} tone="accent" />
        <KpiCard label="Despachados" value={dispatched} hint="Entregados al taller" icon={Truck} tone="success" />
        <KpiCard label="Recibidos de procura" value={received} hint="Ingresados al inventario" icon={CheckCircle2} tone="info" />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => `${row.request.id}-${row.item.id}`}
        search={{
          placeholder: 'Buscar por solicitud, hoja, repuesto o código…',
          getText: (row) =>
            `${row.request.code} ${row.route?.code ?? ''} ${row.item.name} ${row.item.code}`,
        }}
        filters={
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los destinos</SelectItem>
              <SelectItem value="WAREHOUSE">Almacén</SelectItem>
              <SelectItem value="PROCURE">Procura</SelectItem>
            </SelectContent>
          </Select>
        }
        actions={[
          {
            label: 'Aprobar',
            icon: CheckCircle2,
            hidden: (row) =>
              row.item.destination !== 'WAREHOUSE' || row.item.status !== 'PENDING',
            onSelect: (row) => {
              updateSpareItemStatus(row.request.id, row.item.id, 'APPROVED', user.id);
              toast.success(`${row.item.name} aprobado`);
            },
          },
          {
            label: 'Despachar',
            icon: Truck,
            hidden: (row) =>
              row.item.destination !== 'WAREHOUSE' || row.item.status === 'DISPATCHED',
            onSelect: (row) => {
              updateSpareItemStatus(row.request.id, row.item.id, 'DISPATCHED', user.id);
              toast.success(`${row.item.name} despachado al taller`);
            },
          },
          {
            label: 'Recibir de Procura',
            icon: CheckCircle2,
            hidden: (row) =>
              row.item.destination !== 'PROCURE' || row.item.status === 'RECEIVED',
            onSelect: (row) => {
              updateSpareItemStatus(row.request.id, row.item.id, 'RECEIVED', user.id);
              toast.success(`${row.item.name} ingresado al inventario`);
            },
          },
        ]}
        pageSize={12}
        emptyTitle="Sin solicitudes pendientes"
        emptyDescription="Cuando taller solicite repuestos, aparecerán aquí."
        caption="Solicitudes de repuestos del taller"
      />
    </div>
  );
}
