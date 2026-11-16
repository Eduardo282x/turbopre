import { CheckCircle2, Eye, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  NonConformitySeverityBadge,
  NonConformityStatusBadge,
  ServiceModeBadge,
} from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { NonConformity } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';
import { canManageNonConformities } from '@/lib/permissions';

interface NonConformityRow extends NonConformity {
  orderCode: string;
  mode: 'SHOP' | 'FIELD' | 'PROJECT' | 'SUPPLY';
  clientName: string;
}

export function NonConformitiesPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const updateNonConformityStatus = usePreviewStore((state) => state.updateNonConformityStatus);
  const navigate = useNavigate();

  if (!user) return null;

  const rows: NonConformityRow[] = db.nonConformities.map((record) => {
    const order = db.serviceOrders.find((item) => item.id === record.serviceOrderId);
    const client = db.clients.find((item) => item.id === order?.clientId);
    return {
      ...record,
      orderCode: order?.code ?? '—',
      mode: order?.mode ?? 'SHOP',
      clientName: client?.name ?? '—',
    };
  });

  const open = rows.filter((row) => row.status === 'OPEN').length;
  const inProgress = rows.filter((row) => row.status === 'IN_PROGRESS').length;
  const closed = rows.filter((row) => row.status === 'CLOSED').length;

  const columns: DataTableColumn<NonConformityRow>[] = [
    {
      id: 'order',
      header: 'Expediente',
      cell: (row) => (
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">{row.orderCode}</p>
          <p className="text-xs text-muted-foreground">{row.clientName}</p>
          <ServiceModeBadge mode={row.mode} />
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.orderCode,
    },
    {
      id: 'description',
      header: 'Hallazgo',
      cell: (row) => <span className="block max-w-96 text-sm text-foreground">{row.description}</span>,
    },
    {
      id: 'severity',
      header: 'Severidad',
      cell: (row) => <NonConformitySeverityBadge severity={row.severity} />,
      sortable: true,
      sortValue: (row) => row.severity,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (row) => <NonConformityStatusBadge status={row.status} />,
      sortable: true,
      sortValue: (row) => row.status,
    },
    {
      id: 'responsible',
      header: 'Responsable',
      cell: (row) => (
        <span className="text-xs">{db.users.find((candidate) => candidate.id === row.responsibleId)?.name ?? '—'}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'action',
      header: 'Acción correctiva',
      cell: (row) => <span className="block max-w-72 text-xs text-muted-foreground">{row.correctiveAction}</span>,
      hideOnMobile: true,
    },
    {
      id: 'date',
      header: 'Fecha',
      cell: (row) => <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (row) => new Date(row.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calidad"
        title="No conformidades"
        description="Hallazgos, acciones correctivas y cierre dentro del sistema de gestión integrado."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total" value={rows.length} hint="No conformidades registradas" icon={ShieldAlert} tone="accent" />
        <KpiCard label="Abiertas" value={open} hint="Requieren acción inmediata" icon={ShieldAlert} tone="danger" />
        <KpiCard label="En tratamiento" value={inProgress} hint="Con acción en curso" icon={ShieldAlert} tone="warning" />
        <KpiCard label="Cerradas" value={closed} hint="Con acción verificada" icon={CheckCircle2} tone="success" />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        search={{
          placeholder: 'Buscar por expediente, hallazgo o responsable…',
          getText: (row) => `${row.orderCode} ${row.description} ${row.correctiveAction}`,
        }}
        actions={[
          { label: 'Ver expediente', icon: Eye, onSelect: (row) => navigate(`/expedientes/${row.serviceOrderId}`) },
          {
            label: 'Cerrar NC',
            icon: CheckCircle2,
            hidden: (row) => !canManageNonConformities(user) || row.status === 'CLOSED',
            onSelect: (row) => {
              updateNonConformityStatus(row.id, 'CLOSED', user.id);
              toast.success('No conformidad cerrada');
            },
          },
        ]}
        onRowClick={(row) => navigate(`/expedientes/${row.serviceOrderId}`)}
        pageSize={10}
        emptyTitle="Sin no conformidades"
        emptyDescription="No hay hallazgos registrados."
        caption="No conformidades"
      />
    </div>
  );
}
