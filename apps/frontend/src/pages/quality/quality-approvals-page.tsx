import { CheckCircle2, Eye, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { PriorityBadge, RouteStatusBadge } from '@/components/common/badges';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { getQualityQueue } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { RouteSheetWithRelations } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';
import { RouteReviewDialog } from '@/pages/route-sheets/route-review-dialog';

export function QualityApprovalsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const approveQuality = usePreviewStore((state) => state.approveQuality);
  const rejectQuality = usePreviewStore((state) => state.rejectQuality);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<RouteSheetWithRelations | null>(null);

  if (!user) return null;

  const queue = getQualityQueue(db);

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
      id: 'parts',
      header: 'Partes',
      cell: (route) => <span className="text-sm">{route.parts.length}</span>,
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
      id: 'due',
      header: 'Entrega',
      cell: (route) => <span className="text-xs text-muted-foreground">{formatDate(route.dueDate)}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) => new Date(route.dueDate),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calidad"
        title="Visto bueno"
        description="Expedientes en revisión final. Aprueba para liberar la entrega o devuelve al taller con observaciones."
        actions={<ShieldCheck className="size-5 text-primary" />}
      />

      {queue.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No hay expedientes en calidad"
          description="Todos los equipos en revisión final ya fueron procesados."
        />
      ) : (
        <DataTable
          data={queue}
          columns={columns}
          getRowId={(route) => route.id}
          search={{
            placeholder: 'Buscar por código, componente o cliente…',
            getText: (route) => `${route.code} ${route.component.name} ${route.client?.name ?? ''}`,
          }}
          actions={[
            { label: 'Evaluar', icon: Eye, onSelect: (route) => setSelected(route) },
            { label: 'Abrir detalle', icon: ShieldCheck, onSelect: (route) => navigate(`/hojas-de-ruta/${route.id}`) },
          ]}
          pageSize={10}
          emptyTitle="Sin expedientes"
          emptyDescription="No hay hojas esperando el visto bueno."
          caption="Hojas de ruta pendientes de calidad"
        />
      )}

      <RouteReviewDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        route={selected}
        mode="quality"
        onApprove={(observations) => {
          if (!selected) return;
          approveQuality(selected.id, user.id, observations);
          toast.success(`${selected.code} lista para entrega`);
          setSelected(null);
        }}
        onReject={(reason) => {
          if (!selected) return;
          rejectQuality(selected.id, user.id, reason);
          toast.info(`${selected.code} devuelta al taller`);
          setSelected(null);
        }}
      />
    </div>
  );
}
