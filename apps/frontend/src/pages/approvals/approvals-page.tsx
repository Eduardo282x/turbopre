import { ClipboardCheck, Eye } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { PriorityBadge, RouteStatusBadge } from '@/components/common/badges';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { getPendingApprovals } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { RouteSheetWithRelations } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';
import { RouteReviewDialog } from '@/pages/route-sheets/route-review-dialog';

export function ApprovalsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const approveRouteSheet = usePreviewStore((state) => state.approveRouteSheet);
  const rejectRouteSheet = usePreviewStore((state) => state.rejectRouteSheet);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<RouteSheetWithRelations | null>(null);

  if (!user) return null;

  const approvals = getPendingApprovals(db);

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
    },
    {
      id: 'structure',
      header: 'Estructura',
      cell: (route) => (
        <div className="text-xs">
          <p className="text-foreground">{route.parts.length} partes</p>
          <p className="text-muted-foreground">{route.totalPhases} fases</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (route) => <ProgressBar value={route.progress} className="w-28" />,
      hideOnMobile: true,
    },
    {
      id: 'priority',
      header: 'Prioridad',
      cell: (route) => <PriorityBadge priority={route.priority} />,
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (route) => <RouteStatusBadge status={route.status} />,
    },
    {
      id: 'created',
      header: 'Enviada',
      cell: (route) => <span className="text-xs text-muted-foreground">{formatDate(route.createdAt)}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) => new Date(route.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ingeniería"
        title="Aprobaciones"
        description="Revisa la estructura de la hoja de ruta y libera el trabajo hacia las áreas de taller."
      />

      {approvals.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No hay hojas pendientes"
          description="Todas las hojas enviadas a revisión ya fueron procesadas."
        />
      ) : (
        <DataTable
          data={approvals}
          columns={columns}
          getRowId={(route) => route.id}
          search={{
            placeholder: 'Buscar por código, componente o cliente…',
            getText: (route) => `${route.code} ${route.component.name} ${route.client?.name ?? ''}`,
          }}
          actions={[
            { label: 'Revisar', icon: Eye, onSelect: (route) => setSelected(route) },
            { label: 'Abrir detalle', icon: ClipboardCheck, onSelect: (route) => navigate(`/hojas-de-ruta/${route.id}`) },
          ]}
          pageSize={10}
          emptyTitle="Sin aprobaciones"
          emptyDescription="No hay hojas en revisión."
          caption="Hojas de ruta pendientes de aprobación"
        />
      )}

      <RouteReviewDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        route={selected}
        mode="approval"
        onApprove={() => {
          if (!selected) return;
          approveRouteSheet(selected.id, user.id);
          toast.success(`${selected.code} aprobada`);
          setSelected(null);
        }}
        onReject={(reason) => {
          if (!selected) return;
          rejectRouteSheet(selected.id, user.id, reason);
          toast.info(`${selected.code} devuelta a borrador`);
          setSelected(null);
        }}
      />
    </div>
  );
}
