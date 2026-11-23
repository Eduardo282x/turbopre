import { ClipboardList, FileText, History } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  RouteStatusBadge,
  ServiceOrderStatusBadge,
} from '@/components/common/badges';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getRouteSheetsWithRelations,
} from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { useServiceOrders } from '@/hooks/use-commercial-data';
import type { RouteSheetWithRelations } from '@/features/preview/types';
import type { ServiceOrderRecord } from '@turbopre/shared';
import { formatDate, formatDateTime } from '@/lib/formatters';

export function HistoryPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const ordersQuery = useServiceOrders();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const canSeeOds = user?.role === 'ADMIN' || user?.role === 'SALES';
  const [tab, setTab] = useState(params.get('tab') === 'ods' || (user?.role === 'SALES') ? 'ods' : 'rutas');

  const orders = ordersQuery.data ?? [];
  const routes = getRouteSheetsWithRelations(db);
  const odsColumns: DataTableColumn<ServiceOrderRecord>[] = useMemo(
    () => [
      {
        id: 'code',
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
        id: 'created',
        header: 'Creada',
        cell: (order) => (
          <span className="text-xs text-muted-foreground">{formatDate(order.requestedAt)}</span>
        ),
        hideOnMobile: true,
        sortable: true,
        sortValue: (order) => new Date(order.requestedAt),
      },
      {
        id: 'progress',
        header: 'Avance',
        cell: (order) => <ProgressBar value={order.progress} className="w-28" showValue />,
        hideOnMobile: true,
      },
    ],
    [],
  );

  const routeColumns: DataTableColumn<RouteSheetWithRelations>[] = useMemo(
    () => [
      {
        id: 'code',
        header: 'Hoja de ruta',
        cell: (route) => (
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{route.code}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              ODS {route.serviceOrder.code} · {route.serviceOrder.subCode}
            </p>
          </div>
        ),
        sortable: true,
        sortValue: (route) => route.code,
      },
      {
        id: 'client',
        header: 'Cliente / equipo',
        cell: (route) => (
          <div className="text-xs">
            <p className="font-medium text-foreground">{route.client?.name ?? '—'}</p>
            <p className="text-muted-foreground">
              {route.asset?.manufacturer} {route.asset?.model} · {route.equipmentCode}
            </p>
          </div>
        ),
        hideOnMobile: true,
      },
      {
        id: 'status',
        header: 'Estado',
        cell: (route) => <RouteStatusBadge status={route.status} />,
        sortable: true,
        sortValue: (route) => route.status,
      },
      {
        id: 'prepared',
        header: 'Preparada',
        cell: (route) => (
          <div className="text-xs text-muted-foreground">
            <p>{route.creator.name}</p>
            <p>{formatDate(route.preparedAt)}</p>
          </div>
        ),
        hideOnMobile: true,
      },
      {
        id: 'approved',
        header: 'Aprobada',
        cell: (route) => (
          <div className="text-xs text-muted-foreground">
            <p>{route.approver?.name ?? 'Pendiente'}</p>
            <p>{route.approvedAt ? formatDate(route.approvedAt) : '—'}</p>
          </div>
        ),
        hideOnMobile: true,
      },
      {
        id: 'delivered',
        header: 'Entregada',
        cell: (route) => (
          <span className="text-xs text-muted-foreground">
            {route.deliveredAt ? formatDateTime(route.deliveredAt) : '—'}
          </span>
        ),
        hideOnMobile: true,
      },
      {
        id: 'progress',
        header: 'Avance',
        cell: (route) => <ProgressBar value={route.progress} className="w-28" showValue />,
        hideOnMobile: true,
      },
    ],
    [],
  );

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trazabilidad"
        title="Historial"
        description="Todas las órdenes de servicio y hojas de ruta, con su estado y fechas clave."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
          {canSeeOds && (
            <TabsTrigger value="ods">
              <ClipboardList /> Órdenes de servicio ({orders.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="rutas">
            <FileText /> Hojas de ruta ({routes.length})
          </TabsTrigger>
        </TabsList>

        {canSeeOds && (
          <TabsContent value="ods" className="mt-4">
            <DataTable
              data={orders}
              columns={odsColumns}
              getRowId={(order) => order.id}
              isLoading={ordersQuery.isLoading}
              search={{
                placeholder: 'Buscar por ODS, cliente, equipo o descripción…',
                getText: (order) =>
                  `${order.orderNumber} ${order.client.name} ${order.equipment.code} ${order.equipment.name} ${order.description}`,
              }}
              onRowClick={(order) => navigate(`/ordenes-servicio/${order.id}`)}
              pageSize={12}
              emptyTitle="Sin órdenes de servicio"
              emptyDescription="Las ODS creadas por Ventas aparecerán aquí."
              caption="Historial de órdenes de servicio"
            />
          </TabsContent>
        )}

        <TabsContent value="rutas" className="mt-4">
          <DataTable
            data={routes}
            columns={routeColumns}
            getRowId={(route) => route.id}
            search={{
              placeholder: 'Buscar por hoja, ODS, cliente o equipo…',
              getText: (route) =>
                `${route.code} ${route.serviceOrder.code} ${route.serviceOrder.subCode} ${route.client?.name ?? ''} ${route.asset?.model ?? ''}`,
            }}
            onRowClick={(route) => navigate(`/hojas-de-ruta/${route.id}`)}
            pageSize={12}
            emptyTitle="Sin hojas de ruta"
            emptyDescription="Las hojas creadas por Ingeniería aparecerán aquí."
            caption="Historial de hojas de ruta"
          />
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
        <History className="size-4 shrink-0" />
        <p>
          El historial es de solo lectura. Las acciones se realizan desde la hoja de ruta o la orden de servicio.
        </p>
      </div>
    </div>
  );
}
