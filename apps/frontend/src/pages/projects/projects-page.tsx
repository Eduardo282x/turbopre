import { Briefcase, Eye, FolderKanban, Gauge } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ProjectPhaseBadge, ServiceModeBadge, ServiceOrderStatusBadge } from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { getProjectsWithRelations } from '@/features/preview/store/selectors';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { ProjectWithRelations } from '@/features/preview/types';

export function ProjectsPage() {
  const db = usePreviewStore((state) => state.db);
  const navigate = useNavigate();
  const projects = getProjectsWithRelations(db);

  const columns: DataTableColumn<ProjectWithRelations>[] = [
    {
      id: 'project',
      header: 'Proyecto',
      cell: (project) => (
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">{project.name}</p>
          <p className="text-xs text-muted-foreground">{project.serviceOrder.code} · {project.client?.name}</p>
          <div className="flex flex-wrap gap-1">
            <ServiceModeBadge mode="PROJECT" />
            <ServiceOrderStatusBadge status={project.serviceOrder.status} />
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (project) => project.name,
    },
    {
      id: 'asset',
      header: 'Activo',
      cell: (project) => (
        <div className="text-xs">
          <p className="text-foreground">{project.asset?.manufacturer} {project.asset?.model}</p>
          <p className="text-muted-foreground">{project.asset?.tag} · {project.asset?.ratedPower}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'phase',
      header: 'Fase',
      cell: (project) => <ProjectPhaseBadge phase={project.phase} />,
      sortable: true,
      sortValue: (project) => project.phase,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (project) => <ProgressBar value={project.progress} className="w-28" />,
    },
    {
      id: 'milestones',
      header: 'Hitos',
      cell: (project) => (
        <span className="text-xs text-muted-foreground">
          {project.milestones.filter((milestone) => milestone.status === 'COMPLETED').length} / {project.milestones.length} completados
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (project) => <ServiceOrderStatusBadge status={project.serviceOrder.status} />,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Proyectos"
        title="Proyectos electromecánicos"
        description="Ingeniería, procura, construcción, precomisionamiento y comisionamiento."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Proyectos" value={projects.length} hint="Expedientes de proyecto" icon={Briefcase} tone="accent" />
        <KpiCard label="En ingeniería" value={projects.filter((project) => project.phase === 'ENGINEERING').length} hint="Diseño y planos" icon={FolderKanban} tone="info" />
        <KpiCard label="En construcción" value={projects.filter((project) => project.phase === 'CONSTRUCTION').length} hint="Montaje en sitio" icon={Gauge} tone="warning" />
        <KpiCard label="Cerrados" value={projects.filter((project) => project.phase === 'CLOSED').length} hint="Proyectos finalizados" icon={Eye} tone="success" />
      </div>

      <DataTable
        data={projects}
        columns={columns}
        getRowId={(project) => project.id}
        search={{
          placeholder: 'Buscar por proyecto, expediente, cliente o activo…',
          getText: (project) => `${project.name} ${project.serviceOrder.code} ${project.client?.name ?? ''} ${project.asset?.model ?? ''}`,
        }}
        actions={[
          { label: 'Ver expediente', icon: Eye, onSelect: (project) => navigate(`/expedientes/${project.serviceOrderId}`) },
        ]}
        onRowClick={(project) => navigate(`/expedientes/${project.serviceOrderId}`)}
        pageSize={10}
        emptyTitle="Sin proyectos"
        emptyDescription="Crea un expediente en modo Proyecto para iniciar el flujo."
        caption="Proyectos electromecánicos"
      />
    </div>
  );
}
