import { Eye, MapPinned, Truck, Users } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { FieldStatusBadge, ServiceModeBadge, ServiceOrderStatusBadge } from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { getFieldJobsWithRelations } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { FieldJobWithRelations } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';
import { canManageField } from '@/lib/permissions';

export function FieldPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const updateFieldJobStatus = usePreviewStore((state) => state.updateFieldJobStatus);
  const navigate = useNavigate();

  if (!user) return null;

  const jobs = getFieldJobsWithRelations(db);
  const active = jobs.filter((job) => ['MOBILIZED', 'IN_EXECUTION'].includes(job.status)).length;
  const planned = jobs.filter((job) => job.status === 'PLANNED').length;
  const closed = jobs.filter((job) => job.status === 'CLOSED').length;

  const columns: DataTableColumn<FieldJobWithRelations>[] = [
    {
      id: 'order',
      header: 'Expediente / activo',
      cell: (job) => (
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">{job.serviceOrder.code}</p>
          <p className="text-xs text-muted-foreground">{job.asset?.manufacturer} {job.asset?.model} · {job.asset?.tag}</p>
          <div className="flex flex-wrap gap-1">
            <ServiceModeBadge mode="FIELD" />
            <ServiceOrderStatusBadge status={job.serviceOrder.status} />
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (job) => job.serviceOrder.code,
    },
    {
      id: 'site',
      header: 'Sitio',
      cell: (job) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{job.siteName}</p>
          <p className="text-muted-foreground">{job.location}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'permits',
      header: 'Permisos / AST',
      cell: (job) => (
        <div className="text-xs">
          <p className="text-foreground">{job.permits}</p>
          <p className="text-muted-foreground">{job.riskAnalysis}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'crew',
      header: 'Cuadrilla',
      cell: (job) => <span className="text-xs text-muted-foreground">{job.crew.join(', ') || 'Sin asignar'}</span>,
      hideOnMobile: true,
    },
    {
      id: 'resources',
      header: 'Recursos',
      cell: (job) => (
        <div className="text-xs">
          <p className="text-foreground">{job.containers} contenedor(es)</p>
          <p className="text-muted-foreground">{job.cranes}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (job) => <FieldStatusBadge status={job.status} />,
      sortable: true,
      sortValue: (job) => job.status,
    },
    {
      id: 'mobilization',
      header: 'Movilización',
      cell: (job) => (
        <div className="text-xs text-muted-foreground">
          <p>{job.mobilizationDate ? formatDate(job.mobilizationDate) : 'Pendiente'}</p>
          <p>{job.demobilizationDate ? formatDate(job.demobilizationDate) : ''}</p>
        </div>
      ),
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Servicios de campo"
        title="Operaciones en sitio"
        description="Movilizaciones, permisos, cuadrillas y reportes de trabajos en planta."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Trabajos de campo" value={jobs.length} hint="Expedientes en sitio" icon={MapPinned} tone="accent" />
        <KpiCard label="Planificados" value={planned} hint="Pendientes de movilizar" icon={Truck} tone="warning" />
        <KpiCard label="Activos" value={active} hint="Movilizados o en ejecución" icon={Users} tone="info" />
        <KpiCard label="Cerrados" value={closed} hint="Operaciones finalizadas" icon={Eye} tone="success" />
      </div>

      <DataTable
        data={jobs}
        columns={columns}
        getRowId={(job) => job.id}
        search={{
          placeholder: 'Buscar por expediente, sitio, activo o cuadrilla…',
          getText: (job) => `${job.serviceOrder.code} ${job.siteName} ${job.location} ${job.asset?.model ?? ''} ${job.crew.join(' ')}`,
        }}
        actions={[
          { label: 'Ver expediente', icon: Eye, onSelect: (job) => navigate(`/expedientes/${job.serviceOrderId}`) },
          {
            label: 'Marcar en ejecución',
            icon: MapPinned,
            hidden: (job) => !canManageField(user) || job.status === 'IN_EXECUTION' || job.status === 'CLOSED',
            onSelect: (job) => {
              updateFieldJobStatus(job.id, 'IN_EXECUTION', user.id);
              toast.success('Trabajo de campo actualizado');
            },
          },
          {
            label: 'Desmovilizar',
            icon: Truck,
            hidden: (job) => !canManageField(user) || job.status === 'DEMOBILIZED' || job.status === 'CLOSED',
            onSelect: (job) => {
              updateFieldJobStatus(job.id, 'DEMOBILIZED', user.id);
              toast.success('Desmovilización registrada');
            },
          },
        ]}
        onRowClick={(job) => navigate(`/expedientes/${job.serviceOrderId}`)}
        pageSize={10}
        emptyTitle="Sin trabajos de campo"
        emptyDescription="Crea un expediente en modo Campo para iniciar una movilización."
        caption="Operaciones de campo"
      />
    </div>
  );
}
