import { Eye, Plus, Route } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  PriorityBadge,
  ServiceModeBadge,
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
import {
  SERVICE_MODE_META,
  SERVICE_ORDER_STATUS_META,
  SERVICE_ORDER_STATUS_ORDER,
  SERVICE_SCOPE_META,
} from '@/features/preview/config';
import {
  getServiceOrderMetrics,
  getServiceOrdersWithRelations,
} from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { NewServiceOrderInput, ServiceOrderWithRelations } from '@/features/preview/types';
import { daysUntil, formatDate } from '@/lib/formatters';
import { canCreateServiceOrder, canManageServiceOrder } from '@/lib/permissions';
import { ServiceOrderFormDialog } from './service-order-form-dialog';

export function ExpedientesPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const createServiceOrder = usePreviewStore((state) => state.createServiceOrder);
  const createRouteSheetFromTemplate = usePreviewStore((state) => state.createRouteSheetFromTemplate);
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [modeFilter, setModeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const orders = getServiceOrdersWithRelations(db);
  const metrics = getServiceOrderMetrics(db);
  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const modeMatch = modeFilter === 'all' || order.mode === modeFilter;
        const statusMatch = statusFilter === 'all' || order.status === statusFilter;
        return modeMatch && statusMatch;
      }),
    [modeFilter, orders, statusFilter],
  );

  if (!user) return null;

  const columns: DataTableColumn<ServiceOrderWithRelations>[] = [
    {
      id: 'code',
      header: 'Expediente',
      cell: (order) => (
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">{order.code}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <ServiceModeBadge mode={order.mode} />
            <PriorityBadge priority={order.priority} />
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (order) => order.code,
    },
    {
      id: 'client',
      header: 'Cliente / activo',
      cell: (order) => (
        <div className="min-w-0 text-xs">
          <p className="font-medium text-foreground">{order.client?.name ?? '—'}</p>
          <p className="truncate text-muted-foreground">
            {order.asset ? `${order.asset.manufacturer} ${order.asset.model} · ${order.asset.tag}` : '—'}
          </p>
          <p className="text-muted-foreground/70">{order.site}</p>
        </div>
      ),
      hideOnMobile: true,
      sortable: true,
      sortValue: (order) => order.client?.name ?? '',
    },
    {
      id: 'scope',
      header: 'Alcance',
      cell: (order) => (
        <div className="text-xs">
          <p className="text-foreground">{SERVICE_SCOPE_META[order.scope].label}</p>
          <p className="text-muted-foreground">{order.routeSheet ? order.routeSheet.code : 'Sin hoja de ruta'}</p>
        </div>
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
      id: 'progress',
      header: 'Avance',
      cell: (order) => <ProgressBar value={order.progress} className="w-28" />,
      hideOnMobile: true,
    },
    {
      id: 'due',
      header: 'Compromiso',
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
      id: 'nc',
      header: 'NC',
      cell: (order) => (
        <span className={order.openNonConformities > 0 ? 'font-semibold text-destructive' : 'text-muted-foreground'}>
          {order.openNonConformities}
        </span>
      ),
      hideOnMobile: true,
      sortable: true,
      sortValue: (order) => order.openNonConformities,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Expedientes de servicio"
        title="Centro de expedientes"
        description="Taller, campo, proyectos y suministro en un solo hilo de trazabilidad."
        actions={
          canCreateServiceOrder(user) ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Nuevo expediente
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Expedientes" value={metrics.total} hint="Todos los modos" icon={Route} tone="accent" />
        <KpiCard label="Taller" value={metrics.shop} hint="Servicios en secciones" icon={Route} tone="info" />
        <KpiCard label="Campo" value={metrics.field} hint="Trabajos en sitio" icon={Route} tone="warning" />
        <KpiCard label="NC abiertas" value={metrics.openNonConformities} hint="Requieren acción" icon={Route} tone="danger" />
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        getRowId={(order) => order.id}
        search={{
          placeholder: 'Buscar por expediente, cliente, activo, tag o alcance…',
          getText: (order) =>
            `${order.code} ${order.client?.name ?? ''} ${order.asset?.manufacturer ?? ''} ${order.asset?.model ?? ''} ${order.asset?.tag ?? ''} ${order.site} ${SERVICE_SCOPE_META[order.scope].label}`,
        }}
        filters={
          <>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger size="sm" className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los modos</SelectItem>
                {(Object.keys(SERVICE_MODE_META) as Array<keyof typeof SERVICE_MODE_META>).map((mode) => (
                  <SelectItem key={mode} value={mode}>{SERVICE_MODE_META[mode].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger size="sm" className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {SERVICE_ORDER_STATUS_ORDER.map((status) => (
                  <SelectItem key={status} value={status}>{SERVICE_ORDER_STATUS_META[status].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        actions={[
          { label: 'Ver expediente', icon: Eye, onSelect: (order) => navigate(`/expedientes/${order.id}`) },
          {
            label: 'Generar hoja de ruta',
            icon: Route,
            hidden: (order) => Boolean(order.routeSheetId) || !canManageServiceOrder(user),
            onSelect: (order) => {
              const template = db.serviceTemplates.find((item) => item.scope === order.scope);
              if (!template) {
                toast.error('No hay plantilla para este alcance');
                return;
              }
              createRouteSheetFromTemplate(order.id, template.id, user.id);
              toast.success('Hoja de ruta generada desde plantilla');
            },
          },
        ]}
        onRowClick={(order) => navigate(`/expedientes/${order.id}`)}
        pageSize={10}
        emptyTitle="Sin expedientes"
        emptyDescription="Crea el primer expediente de servicio o ajusta los filtros."
        caption="Expedientes de servicio"
      />

      <ServiceOrderFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(input: NewServiceOrderInput) => {
          const id = createServiceOrder(input, user.id);
          toast.success('Expediente creado');
          navigate(`/expedientes/${id}`);
        }}
      />
    </div>
  );
}
