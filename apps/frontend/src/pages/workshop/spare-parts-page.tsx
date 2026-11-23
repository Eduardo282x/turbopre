import { CheckCircle2, Package, Plus, ShoppingCart, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import {
  SpareDestinationBadge,
  SpareItemStatusBadge,
} from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { SectionCard } from '@/components/common/section-card';
import { SpareRequestDialog } from '@/components/tasks/spare-request-dialog';
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
import { getRouteSheetsWithRelations } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { NewSpareRequestInput, RouteSheet, SpareItem, SpareRequest } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';
import { canRequestSparePart } from '@/lib/permissions';

interface SpareRow {
  request: SpareRequest;
  item: SpareItem;
  route?: RouteSheet;
}

export function SparePartsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const createSpareRequest = usePreviewStore((state) => state.createSpareRequest);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const routes = getRouteSheetsWithRelations(db).filter((route) => route.status !== 'DELIVERED');
  const rows: SpareRow[] = useMemo(
    () =>
      db.spareRequests
        .flatMap((request) => {
          const route = db.routeSheets.find((candidate) => candidate.id === request.routeSheetId);
          return request.items.map((item) => ({ request, item, route }));
        })
        .sort((a, b) => new Date(b.request.requestedAt).getTime() - new Date(a.request.requestedAt).getTime()),
    [db.spareRequests, db.routeSheets],
  );

  if (!user) return null;

  const warehousePending = rows.filter(
    (row) => row.item.destination === 'WAREHOUSE' && row.item.status !== 'DISPATCHED',
  ).length;
  const inProcure = rows.filter((row) => row.item.destination === 'PROCURE' && row.item.status !== 'RECEIVED').length;
  const dispatched = rows.filter((row) => row.item.status === 'DISPATCHED').length;

  const columns: DataTableColumn<SpareRow>[] = [
    {
      id: 'request',
      header: 'Solicitud / hoja',
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{row.request.code}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {row.route?.code ?? '—'}
          </p>
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
      id: 'requested',
      header: 'Solicitada',
      cell: (row) => (
        <div className="text-xs text-muted-foreground">
          <p>{formatDate(row.request.requestedAt)}</p>
          <p>{db.users.find((candidate) => candidate.id === row.request.requestedBy)?.name ?? '—'}</p>
        </div>
      ),
      hideOnMobile: true,
      sortable: true,
      sortValue: (row) => new Date(row.request.requestedAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Taller"
        title="Repuestos"
        description="Solicitudes multi-línea. Si el material no tiene stock, se envía automáticamente a Procura."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Pendientes en almacén" value={warehousePending} hint="Por aprobar o despachar" icon={Package} tone="warning" />
        <KpiCard label="En procura" value={inProcure} hint="Sin stock en almacén" icon={ShoppingCart} tone="accent" />
        <KpiCard label="Despachados" value={dispatched} hint="Entregados al taller" icon={Truck} tone="success" />
      </div>

      {canRequestSparePart(user) && (
        <SectionCard
          title="Nueva solicitud"
          description="Selecciona la hoja de ruta y pide varios materiales en una sola solicitud."
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-72 flex-1">
              <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una hoja de ruta" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.code} · {route.client?.name ?? 'Sin cliente'} · {route.asset?.model ?? ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                if (!selectedRouteId) {
                  toast.error('Selecciona una hoja de ruta');
                  return;
                }
                setDialogOpen(true);
              }}
            >
              <Plus /> Solicitar repuestos
            </Button>
          </div>
        </SectionCard>
      )}

      {inProcure > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <ShoppingCart className="size-5 text-primary" />
          <p className="flex-1 text-foreground">
            Hay <strong>{inProcure}</strong> ítem(s) en Procura. El almacén los agregará al inventario cuando lleguen.
          </p>
          {user.role === 'ADMIN' && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/almacen/solicitudes">
                <CheckCircle2 /> Ver solicitudes
              </Link>
            </Button>
          )}
        </div>
      )}

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => `${row.request.id}-${row.item.id}`}
        search={{
          placeholder: 'Buscar por solicitud, hoja, repuesto o código…',
          getText: (row) =>
            `${row.request.code} ${row.route?.code ?? ''} ${row.item.name} ${row.item.code}`,
        }}
        pageSize={10}
        emptyTitle="Sin repuestos solicitados"
        emptyDescription="Las solicitudes de materiales aparecerán aquí."
        caption="Solicitudes de repuestos"
      />

      <SpareRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(input: NewSpareRequestInput) => {
          createSpareRequest(selectedRouteId, input, user.id);
          toast.success('Solicitud enviada: los ítems con stock van a Almacén y los demás a Procura');
        }}
      />
    </div>
  );
}
