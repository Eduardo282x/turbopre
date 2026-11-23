import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, CheckCircle2, Pencil, Plus, Timer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ProjectStatusBadge } from '@/components/common/badges';
import { FormDialog } from '@/components/common/form-dialog';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
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
import { Textarea } from '@/components/ui/textarea';
import { PROJECT_STATUS_META } from '@/features/preview/config';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { useClients, useProjects } from '@/hooks/use-commercial-data';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate, toDateInputValue } from '@/lib/formatters';
import { canManageProjects as canManageProjectsByRole } from '@turbopre/shared';
import { PROJECT_STATUSES } from '@turbopre/shared';
import type {
  CreateProjectInput,
  ProjectRecord,
  ProjectStatus,
} from '@turbopre/shared';
import { projectsService } from '@/services/projects/projects.service';
import { usersService } from '@/services/users/users.service';

export function ProjectsPage() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const projectsQuery = useProjects();
  const clientsQuery = useClients();
  const managersQuery = useQuery({
    queryKey: ['users', 'options', 'projects'],
    queryFn: () => usersService.options(['ENGINEER', 'PROJECT_MANAGER']),
    staleTime: 5 * 60_000,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRecord | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [clientId, setClientId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('PLANNED');
  const [startDate, setStartDate] = useState(toDateInputValue(new Date()));
  const [dueDate, setDueDate] = useState(
    toDateInputValue(new Date(Date.now() + 60 * 86400000)),
  );
  const [notes, setNotes] = useState('');

  const saveProject = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CreateProjectInput }) =>
      id ? projectsService.update(id, input) : projectsService.create(input),
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(editing ? 'Proyecto actualizado' : 'Proyecto creado', {
        description: `${project.code} · ${project.name}`,
      });
      setFormOpen(false);
    },
    onError: (error) =>
      toast.error('No se pudo guardar el proyecto', {
        description: getApiErrorMessage(error),
      }),
  });

  if (!user) return null;

  const projects = projectsQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const managers = managersQuery.data ?? [];
  const canManageProjects = canManageProjectsByRole(user.role);
  const active = projects.filter((project) =>
    ['PLANNED', 'ACTIVE', 'ON_HOLD'].includes(project.status),
  ).length;
  const completed = projects.filter((project) => project.status === 'COMPLETED').length;

  const openForm = (project?: ProjectRecord) => {
    setEditing(project ?? null);
    setName(project?.name ?? '');
    setCode(project?.code ?? '');
    setClientId(project?.clientId ?? clients[0]?.id ?? '');
    setManagerId(project?.managerId ?? managers[0]?.id ?? '');
    setStatus(project?.status ?? 'PLANNED');
    setStartDate(
      project?.startDate ? toDateInputValue(project.startDate) : toDateInputValue(new Date()),
    );
    setDueDate(
      project?.dueDate
        ? toDateInputValue(project.dueDate)
        : toDateInputValue(new Date(Date.now() + 60 * 86400000)),
    );
    setNotes(project?.notes ?? '');
    setFormOpen(true);
  };

  const submit = () => {
    if (!name.trim()) {
      toast.error('El nombre del proyecto es obligatorio');
      return;
    }

    saveProject.mutate({
      id: editing?.id,
      input: {
        name: name.trim(),
        code: code.trim() || undefined,
        clientId: clientId || null,
        managerId: managerId || null,
        status,
        startDate: startDate ? new Date(`${startDate}T12:00:00`).toISOString() : null,
        dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null,
        notes: notes.trim() || null,
      },
    });
  };

  const columns: DataTableColumn<ProjectRecord>[] = [
    {
      id: 'project',
      header: 'Proyecto',
      cell: (project) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{project.name}</p>
          <p className="text-xs text-muted-foreground">
            {project.code} · {project.clientName ?? 'Sin cliente'}
          </p>
        </div>
      ),
      sortable: true,
      sortValue: (project) => project.name,
    },
    {
      id: 'manager',
      header: 'Responsable',
      cell: (project) => (
        <span className="text-sm">{project.managerName ?? '—'}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (project) => <ProjectStatusBadge status={project.status} />,
      sortable: true,
      sortValue: (project) => project.status,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (project) => (
        <div className="w-36">
          <ProgressBar value={project.progress} className="w-28" showValue />
          <p className="mt-1 text-[10px] text-muted-foreground">
            {project.completedServiceOrderCount} de {project.serviceOrderCount} ODS
          </p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'due',
      header: 'Entrega',
      cell: (project) => (
        <span className="text-xs text-muted-foreground">
          {project.dueDate ? formatDate(project.dueDate) : '—'}
        </span>
      ),
      hideOnMobile: true,
      sortable: true,
      sortValue: (project) => (project.dueDate ? new Date(project.dueDate) : null),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ingeniería"
        title="Proyectos"
        description="Cartera de proyectos de ingeniería, responsable y avance por ODS."
        actions={
          canManageProjects ? (
            <Button onClick={() => openForm()}>
              <Plus /> Nuevo proyecto
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Proyectos"
          value={projects.length}
          hint="Cartera registrada"
          icon={Briefcase}
          tone="accent"
        />
        <KpiCard
          label="Activos"
          value={active}
          hint="Planificados, activos o en pausa"
          icon={Timer}
          tone="info"
        />
        <KpiCard
          label="Completados"
          value={completed}
          hint="Cerrados correctamente"
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {projectsQuery.isError && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {getApiErrorMessage(projectsQuery.error, 'No se pudieron cargar los proyectos')}
        </p>
      )}

      <DataTable
        data={projects}
        columns={columns}
        getRowId={(project) => project.id}
        isLoading={projectsQuery.isLoading}
        search={{
          placeholder: 'Buscar por proyecto, cliente o responsable…',
          getText: (project) =>
            `${project.name} ${project.code} ${project.clientName ?? ''} ${project.managerName ?? ''}`,
        }}
        actions={[
          {
            label: 'Editar',
            icon: Pencil,
            hidden: () => !canManageProjects,
            onSelect: (project) => openForm(project),
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
        title={editing ? 'Editar proyecto' : 'Nuevo proyecto'}
        description="Agrupa órdenes de servicio bajo un responsable y un estado."
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saveProject.isPending}>
              <Plus /> {saveProject.isPending ? 'Guardando…' : 'Guardar proyecto'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="project-name">Nombre del proyecto</FieldLabel>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="project-code">Código</FieldLabel>
            <Input
              id="project-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Se genera si lo dejas vacío"
            />
          </Field>
          <Field>
            <FieldLabel>Estado</FieldLabel>
            <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {PROJECT_STATUS_META[item].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Cliente</FieldLabel>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Responsable</FieldLabel>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un responsable" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="project-start">Inicio</FieldLabel>
            <Input
              id="project-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="project-due">Entrega</FieldLabel>
            <Input
              id="project-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="project-notes">Notas</FieldLabel>
            <Textarea
              id="project-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
        </div>
      </FormDialog>
    </div>
  );
}
