import { Briefcase, CheckCircle2, Eye, Plus, Timer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ProjectPhaseBadge } from '@/components/common/badges';
import { FormDialog } from '@/components/common/form-dialog';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { SectionCard } from '@/components/common/section-card';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROJECT_PHASE_META } from '@/features/preview/config';
import { getProjectsWithRelations } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { NewProjectInput, ProjectPhase } from '@/features/preview/types';
import { formatDate, toDateInputValue } from '@/lib/formatters';
import { canManageProjects } from '@/lib/permissions';

type ProjectRow = ReturnType<typeof getProjectsWithRelations>[number];

export function ProjectsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const createProject = usePreviewStore((state) => state.createProject);
  const [formOpen, setFormOpen] = useState(false);
  const [milestones, setMilestones] = useState<ProjectRow | null>(null);
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [phase, setPhase] = useState<ProjectPhase>('ENGINEERING');
  const [startDate, setStartDate] = useState(toDateInputValue(new Date()));
  const [dueDate, setDueDate] = useState(toDateInputValue(new Date(Date.now() + 60 * 86400000)));

  if (!user) return null;

  const projects = getProjectsWithRelations(db);
  const active = projects.filter((project) => project.phase !== 'CLOSED').length;
  const completed = projects.filter((project) => project.phase === 'CLOSED').length;
  const engineers = db.users.filter((candidate) => candidate.role === 'ENGINEER');

  const columns: DataTableColumn<ProjectRow>[] = [
    {
      id: 'project',
      header: 'Proyecto',
      cell: (project) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{project.name}</p>
          <p className="text-xs text-muted-foreground">{project.client?.name ?? 'Sin cliente'}</p>
        </div>
      ),
      sortable: true,
      sortValue: (project) => project.name,
    },
    {
      id: 'owner',
      header: 'Responsable',
      cell: (project) => <span className="text-sm">{project.owner?.name ?? '—'}</span>,
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
      cell: (project) => <ProgressBar value={project.progress} className="w-28" showValue />,
      hideOnMobile: true,
    },
    {
      id: 'due',
      header: 'Entrega',
      cell: (project) => <span className="text-xs text-muted-foreground">{formatDate(project.dueDate)}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (project) => new Date(project.dueDate),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ingeniería"
        title="Proyectos"
        description="Cartera de proyectos de ingeniería y su avance por hitos."
        actions={
          canManageProjects(user) ? (
            <Button
              onClick={() => {
                setClientId(db.clients[0]?.id ?? '');
                setOwnerId(engineers[0]?.id ?? '');
                setName('');
                setPhase('ENGINEERING');
                setStartDate(toDateInputValue(new Date()));
                setDueDate(toDateInputValue(new Date(Date.now() + 60 * 86400000)));
                setFormOpen(true);
              }}
            >
              <Plus /> Nuevo proyecto
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Proyectos" value={projects.length} hint="Cartera registrada" icon={Briefcase} tone="accent" />
        <KpiCard label="Activos" value={active} hint="En ingeniería, procura o construcción" icon={Timer} tone="info" />
        <KpiCard label="Cerrados" value={completed} hint="Completados" icon={CheckCircle2} tone="success" />
      </div>

      <DataTable
        data={projects}
        columns={columns}
        getRowId={(project) => project.id}
        search={{
          placeholder: 'Buscar por proyecto, cliente o responsable…',
          getText: (project) =>
            `${project.name} ${project.client?.name ?? ''} ${project.owner?.name ?? ''}`,
        }}
        actions={[
          {
            label: 'Ver hitos',
            icon: Eye,
            onSelect: (project) => setMilestones(project),
          },
        ]}
        pageSize={10}
        emptyTitle="Sin proyectos"
        emptyDescription="Crea el primer proyecto de ingeniería."
        caption="Proyectos de ingeniería"
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Nuevo proyecto"
        description="Agrupa hitos de ingeniería, procura, construcción y comisionamiento."
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!name.trim() || !clientId || !ownerId) {
                  toast.error('Completa el nombre, el cliente y el responsable');
                  return;
                }
                const input: NewProjectInput = {
                  name: name.trim(),
                  clientId,
                  ownerId,
                  phase,
                  startDate: new Date(`${startDate}T12:00:00`).toISOString(),
                  dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
                };
                createProject(input, user.id);
                toast.success('Proyecto creado');
                setFormOpen(false);
              }}
            >
              <Plus /> Crear proyecto
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="project-name">Nombre del proyecto</FieldLabel>
            <Input id="project-name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Cliente</FieldLabel>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {db.clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Responsable</FieldLabel>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un ingeniero" />
              </SelectTrigger>
              <SelectContent>
                {engineers.map((engineer) => (
                  <SelectItem key={engineer.id} value={engineer.id}>
                    {engineer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Fase inicial</FieldLabel>
            <Select value={phase} onValueChange={(value) => setPhase(value as ProjectPhase)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROJECT_PHASE_META) as ProjectPhase[]).map((item) => (
                  <SelectItem key={item} value={item}>
                    {PROJECT_PHASE_META[item].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="project-start">Inicio</FieldLabel>
            <Input id="project-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="project-due">Entrega</FieldLabel>
            <Input id="project-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </Field>
        </div>
      </FormDialog>

      <FormDialog
        open={Boolean(milestones)}
        onOpenChange={(open) => {
          if (!open) setMilestones(null);
        }}
        title={milestones?.name ?? 'Hitos del proyecto'}
        description="Avance por fases."
        footer={
          <Button variant="outline" onClick={() => setMilestones(null)}>
            Cerrar
          </Button>
        }
      >
        {milestones && (
          <div className="space-y-2">
            {milestones.milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{milestone.name}</p>
                  <p className="text-[11px] text-muted-foreground">{PROJECT_PHASE_META[milestone.phase].label}</p>
                </div>
                <Badge variant="outline">{milestone.status === 'COMPLETED' ? 'Completado' : milestone.status === 'IN_PROGRESS' ? 'En proceso' : 'Pendiente'}</Badge>
              </div>
            ))}
          </div>
        )}
      </FormDialog>

      <SectionCard title="Hitos" description="Los proyectos agrupan ingeniería, procura, construcción y comisionamiento.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="rounded-xl border border-border/70 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.client?.name}</p>
                </div>
                <ProjectPhaseBadge phase={project.phase} />
              </div>
              <div className="mt-3 space-y-1.5">
                {project.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-muted-foreground">{milestone.name}</span>
                    <span className={milestone.status === 'COMPLETED' ? 'text-success' : milestone.status === 'IN_PROGRESS' ? 'text-warning' : 'text-muted-foreground'}>
                      {milestone.status === 'COMPLETED' ? 'Listo' : milestone.status === 'IN_PROGRESS' ? 'En curso' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
