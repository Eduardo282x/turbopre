import { Eye, Printer } from 'lucide-react';
import { useNavigate } from 'react-router';
import { RouteStatusBadge } from '@/components/common/badges';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { getRoutesWithRelations } from '@/features/preview/store/selectors';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { RouteSheetWithRelations } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';

const HISTORY_STATUSES = ['APPROVED', 'IN_PROGRESS', 'IN_QUALITY', 'READY_FOR_DELIVERY', 'DELIVERED'];

export function RouteSheetHistoryPage() {
  const db = usePreviewStore((state) => state.db);
  const navigate = useNavigate();

  const routes = getRoutesWithRelations(db)
    .filter((route) => HISTORY_STATUSES.includes(route.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const columns: DataTableColumn<RouteSheetWithRelations>[] = [
    {
      id: 'code',
      header: 'Hoja de ruta',
      cell: (route) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{route.code}</p>
          <p className="max-w-64 truncate text-xs text-muted-foreground">{route.component.name}</p>
        </div>
      ),
      sortable: true,
      sortValue: (route) => route.code,
    },
    {
      id: 'client',
      header: 'Cliente',
      cell: (route) => <span className="text-sm">{route.client?.name ?? '—'}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) => route.client?.name ?? '',
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (route) => <RouteStatusBadge status={route.status} />,
      sortable: true,
      sortValue: (route) => route.status,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (route) => <ProgressBar value={route.progress} className="w-28" />,
      hideOnMobile: true,
    },
    {
      id: 'approved',
      header: 'Aprobación',
      cell: (route) => (
        <span className="text-xs text-muted-foreground">
          {route.approvedAt ? formatDate(route.approvedAt) : 'Pendiente'}
        </span>
      ),
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) => (route.approvedAt ? new Date(route.approvedAt) : null),
    },
    {
      id: 'delivered',
      header: 'Entrega',
      cell: (route) => (
        <span className="text-xs text-muted-foreground">
          {route.deliveredAt ? formatDate(route.deliveredAt) : 'Pendiente'}
        </span>
      ),
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) => (route.deliveredAt ? new Date(route.deliveredAt) : null),
    },
    {
      id: 'updated',
      header: 'Última actividad',
      cell: (route) => <span className="text-xs text-muted-foreground">{formatDate(route.updatedAt)}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) => new Date(route.updatedAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trazabilidad"
        title="Historial de hojas de ruta"
        description="Expedientes aprobados, en ejecución, en calidad y entregados."
      />
      <DataTable
        data={routes}
        columns={columns}
        getRowId={(route) => route.id}
        search={{
          placeholder: 'Buscar por código, componente o cliente…',
          getText: (route) => `${route.code} ${route.component.name} ${route.client?.name ?? ''}`,
        }}
        actions={[
          { label: 'Ver detalle', icon: Eye, onSelect: (route) => navigate(`/hojas-de-ruta/${route.id}`) },
          { label: 'Imprimir', icon: Printer, onSelect: () => window.print() },
        ]}
        onRowClick={(route) => navigate(`/hojas-de-ruta/${route.id}`)}
        pageSize={10}
        emptyTitle="Sin historial"
        emptyDescription="Cuando las hojas de ruta avancen en el flujo aparecerán aquí."
        caption="Historial de hojas de ruta"
      />
    </div>
  );
}
