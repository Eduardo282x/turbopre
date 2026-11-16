import { Package, Truck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/common/status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { getWarehouseRequests } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { Component, RouteSheet, SparePart } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';

interface RequestGroup {
  routeId: string;
  route?: RouteSheet;
  component?: Component;
  requester: string;
  requestedAt: string;
  items: SparePart[];
  pending: number;
}

export function RequestsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const updateSparePartStatus = usePreviewStore((state) => state.updateSparePartStatus);
  const [dispatching, setDispatching] = useState<RequestGroup | null>(null);

  if (!user) return null;

  const requests = getWarehouseRequests(db);
  const grouped = new Map<string, SparePart[]>();
  requests.forEach((spare) => {
    const list = grouped.get(spare.routeSheetId) ?? [];
    list.push(spare);
    grouped.set(spare.routeSheetId, list);
  });

  const groups: RequestGroup[] = [...grouped.entries()].map(([routeId, items]) => {
    const route = db.routeSheets.find((item) => item.id === routeId);
    const component = route ? db.components.find((item) => item.id === route.componentId) : undefined;
    const requester = db.users.find((candidate) => candidate.id === items[0]?.requestedBy)?.name ?? '—';
    return {
      routeId,
      route,
      component,
      requester,
      requestedAt: items[0]?.requestedAt ?? '',
      items,
      pending: items.filter((item) => item.status === 'PENDING').length,
    };
  });

  const columns: DataTableColumn<RequestGroup>[] = [
    {
      id: 'route',
      header: 'Hoja de ruta',
      cell: (group) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{group.route?.code ?? '—'}</p>
          <p className="max-w-56 truncate text-xs text-muted-foreground">{group.component?.name ?? '—'}</p>
        </div>
      ),
      sortable: true,
      sortValue: (group) => group.route?.code ?? '',
    },
    {
      id: 'requester',
      header: 'Solicitante',
      cell: (group) => (
        <div className="text-xs">
          <p className="text-foreground">{group.requester}</p>
          <p className="text-muted-foreground">{group.requestedAt ? formatDate(group.requestedAt) : '—'}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'items',
      header: 'Materiales',
      cell: (group) => (
        <ul className="max-w-72 space-y-1 text-xs">
          {group.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2">
              <span className="truncate text-foreground">
                <strong>{item.quantity}×</strong> {item.name}
              </span>
              <StatusBadge tone={item.status === 'PENDING' ? 'warning' : 'info'} className="shrink-0 text-[10px]">
                {item.status === 'PENDING' ? 'Pendiente' : 'Aprobado'}
              </StatusBadge>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'status',
      header: 'Resumen',
      cell: (group) => (
        <div className="text-xs">
          <p className="text-foreground">{group.items.length} ítems</p>
          <p className="text-muted-foreground">{group.pending} pendientes</p>
        </div>
      ),
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Almacén"
        title="Solicitudes de taller"
        description="Pedidos de repuestos agrupados por hoja de ruta, listos para despacho."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard label="Órdenes pendientes" value={groups.length} hint="Hojas con materiales por despachar" icon={Package} tone="warning" />
        <KpiCard label="Ítems por despachar" value={requests.length} hint="Repuestos en cola" icon={Truck} tone="accent" />
      </div>

      <DataTable
        data={groups}
        columns={columns}
        getRowId={(group) => group.routeId}
        search={{
          placeholder: 'Buscar por hoja, componente o solicitante…',
          getText: (group) => `${group.route?.code ?? ''} ${group.component?.name ?? ''} ${group.requester}`,
        }}
        actions={[
          {
            label: 'Despachar todo',
            icon: Truck,
            onSelect: (group) => setDispatching(group),
          },
        ]}
        pageSize={10}
        emptyTitle="Sin solicitudes pendientes"
        emptyDescription="Los pedidos de repuestos aparecerán aquí cuando el taller los cree."
        caption="Solicitudes de repuestos agrupadas"
      />

      <ConfirmDialog
        open={Boolean(dispatching)}
        onOpenChange={(open) => {
          if (!open) setDispatching(null);
        }}
        title="Despachar materiales"
        description={`Se marcarán ${dispatching?.items.length ?? 0} repuesto(s) como despachados para ${dispatching?.route?.code ?? 'la hoja'}. Confirma que el material físico fue entregado.`}
        confirmLabel="Sí, despachar"
        onConfirm={() => {
          if (!dispatching) return;
          dispatching.items.forEach((item) => {
            if (item.status !== 'DISPATCHED') {
              updateSparePartStatus(item.id, 'DISPATCHED', user.id);
            }
          });
          toast.success('Materiales despachados al taller');
          setDispatching(null);
        }}
      />
    </div>
  );
}
