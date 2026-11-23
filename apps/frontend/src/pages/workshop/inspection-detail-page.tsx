import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Plus,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  InspectionStatusBadge,
  PriorityBadge,
} from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { FormDialog } from '@/components/common/form-dialog';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { SectionCard } from '@/components/common/section-card';
import { Timeline } from '@/components/common/timeline';
import { ApiCompleteTaskDialog } from '@/components/tasks/api-complete-task-dialog';
import { ApiTaskBuilder, createEmptyApiTask } from '@/components/tasks/api-task-builder';
import { ApiTaskList } from '@/components/tasks/api-task-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AUDIT_ACTION_META } from '@/features/preview/config';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { useInspection } from '@/hooks/use-inspections';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate, formatDateTime } from '@/lib/formatters';
import {
  canApproveInspection,
  canCompleteTask,
  canEditInspection,
  canManageRoutes,
  canViewInspections,
} from '@turbopre/shared';
import type {
  CompleteTaskInput,
  CreateTaskInput,
  TaskRecord,
} from '@turbopre/shared';
import { useAuthStore } from '@/stores/use-auth-store';
import { catalogsService } from '@/services/catalogs/catalogs.service';
import { inspectionsService } from '@/services/inspections/inspections.service';
import { tasksService } from '@/services/tasks/tasks.service';

export function InspectionDetailPage() {
  const { id } = useParams();
  const user = useCurrentUser();
  const authUser = useAuthStore((state) => state.user);
  const db = usePreviewStore((state) => state.db);
  const queryClient = useQueryClient();
  const inspectionQuery = useInspection(id);
  const catalogsQuery = useQuery({
    queryKey: ['catalogs', 'organization'],
    queryFn: () => catalogsService.getOrganization(),
    staleTime: 5 * 60_000,
  });

  const [completeTask, setCompleteTask] = useState<TaskRecord | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [newTasks, setNewTasks] = useState<CreateTaskInput[]>([]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['inspections'] });
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    void queryClient.invalidateQueries({ queryKey: ['service-orders'] });
  };

  const completeMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: CompleteTaskInput }) =>
      tasksService.complete(taskId, payload),
    onSuccess: () => {
      invalidate();
      toast.success('Tarea de inspección completada');
      setCompleteOpen(false);
      setCompleteTask(null);
    },
    onError: (error) =>
      toast.error('No se pudo completar la tarea', {
        description: getApiErrorMessage(error),
      }),
  });

  const addTasksMutation = useMutation({
    mutationFn: async (tasks: CreateTaskInput[]) => {
      for (const task of tasks) {
        await inspectionsService.addTask(id as string, task);
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success('Tarea(s) agregada(s) a la inspección');
      setAddOpen(false);
      setNewTasks([]);
    },
    onError: (error) =>
      toast.error('No se pudieron agregar las tareas', {
        description: getApiErrorMessage(error),
      }),
  });

  const approveMutation = useMutation({
    mutationFn: () => inspectionsService.approve(id as string),
    onSuccess: () => {
      invalidate();
      toast.success('Inspección aprobada');
      setApproveOpen(false);
    },
    onError: (error) =>
      toast.error('No se pudo aprobar la inspección', {
        description: getApiErrorMessage(error),
      }),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) =>
      inspectionsService.reject(id as string, { reason }),
    onSuccess: () => {
      invalidate();
      toast.info('Inspección devuelta a taller');
      setRejectOpen(false);
      setRejectReason('');
    },
    onError: (error) =>
      toast.error('No se pudo rechazar la inspección', {
        description: getApiErrorMessage(error),
      }),
  });

  const inspection = inspectionQuery.data ?? null;

  if (!user || !authUser) return null;

  const canSeeInspectionList = canViewInspections(authUser.role);
  const backTo = canSeeInspectionList ? '/taller/inspecciones' : '/mis-tareas';
  const backLabel = canSeeInspectionList
    ? 'Volver a inspecciones'
    : 'Volver a mis tareas';

  if (inspectionQuery.isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Cargando inspección…
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <EmptyState
          icon={ClipboardCheck}
          title="Inspección no encontrada"
          description="La inspección solicitada no existe o fue eliminada."
          action={
            <Button asChild variant="outline">
              <Link to={backTo}>
                <ArrowLeft /> {backLabel}
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const previewInspectionExists = db.inspections.some(
    (previewInspection) => previewInspection.id === inspection.id,
  );
  const route = db.routeSheets.find(
    (candidate) => candidate.inspectionId === inspection.id,
  );
  const allCompleted =
    inspection.tasks.length > 0 &&
    inspection.tasks.every((task) => task.status === 'COMPLETED');
  const canEdit = canEditInspection(authUser.role, inspection.status);
  const canApprove = canApproveInspection(authUser.role);
  const canCreateRoute = canManageRoutes(authUser.role);
  const inspectionAudit = db.audit
    .filter((entry) =>
      [
        inspection.code,
        inspection.id,
        inspection.serviceOrder.orderNumber,
        inspection.serviceOrder.id,
      ].includes(entry.entityId),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const maxStage = inspection.tasks.reduce(
    (max, task) => Math.max(max, task.stage),
    0,
  );

  const openAddTask = () => {
    setNewTasks([
      createEmptyApiTask(catalogsQuery.data, Math.max(1, maxStage + 1)),
    ]);
    setAddOpen(true);
  };

  const openComplete = (task: TaskRecord) => {
    setCompleteTask(task);
    setCompleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 text-muted-foreground">
          <Link to={backTo}>
            <ArrowLeft /> {backLabel}
          </Link>
        </Button>
        <PageHeader
          eyebrow={`${inspection.serviceOrder.orderNumber} · ${inspection.serviceOrder.clientName}`}
          title={inspection.code}
          description={inspection.serviceOrder.description}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <InspectionStatusBadge status={inspection.status} />
              <PriorityBadge priority={inspection.serviceOrder.priority} />
              {canEdit && (
                <Button variant="outline" size="sm" onClick={openAddTask}>
                  <Plus /> Agregar tarea
                </Button>
              )}
              {canApprove && inspection.status === 'COMPLETED' && allCompleted && (
                <Button size="sm" onClick={() => setApproveOpen(true)}>
                  <CheckCircle2 /> Aprobar inspección
                </Button>
              )}
              {canApprove &&
                ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].includes(
                  inspection.status,
                ) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectOpen(true)}
                  >
                    <XCircle /> Rechazar
                  </Button>
                )}
              {route && (
                <Button size="sm" asChild>
                  <Link to={`/hojas-de-ruta/${route.id}`}>
                    <FileText /> Ver hoja de ruta
                  </Link>
                </Button>
              )}
              {!route &&
                inspection.status === 'APPROVED' &&
                canCreateRoute &&
                previewInspectionExists && (
                  <Button size="sm" asChild>
                    <Link to={`/hojas-de-ruta/nueva?inspeccion=${inspection.id}`}>
                      <FileText /> Crear hoja de ruta
                    </Link>
                  </Button>
                )}
            </div>
          }
        />
      </div>

      <Card className="border-border/80 bg-card/80 py-0">
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_300px]">
          <div className="space-y-2">
            <ProgressBar
              value={inspection.progress}
              label={`${inspection.completedTasks} de ${inspection.totalTasks} tareas de inspección completadas`}
            />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Equipo:{' '}
                <strong className="text-foreground">
                  {inspection.serviceOrder.equipmentName}
                </strong>
              </span>
              <span>
                Serial:{' '}
                <strong className="text-foreground">
                  {inspection.serviceOrder.equipmentSerial ?? '—'}
                </strong>
              </span>
              <span>
                Entrega:{' '}
                <strong className="text-foreground">
                  {inspection.serviceOrder.dueAt
                    ? formatDate(inspection.serviceOrder.dueAt)
                    : 'Sin fecha'}
                </strong>
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
            <p className="font-medium text-foreground">Creada por</p>
            <p className="text-muted-foreground">{inspection.createdBy.name}</p>
            <p className="mt-1 font-medium text-foreground">Aprobada por</p>
            <p className="text-muted-foreground">
              {inspection.approvedBy?.name ?? 'Pendiente'}
              {inspection.approvedAt ? ` · ${formatDateTime(inspection.approvedAt)}` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Datos de la ODS"
          description="Información recibida desde Ventas."
        >
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Cliente</dt>
              <dd className="font-medium">{inspection.serviceOrder.clientName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Sitio / planta</dt>
              <dd className="font-medium">{inspection.serviceOrder.siteName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Código del equipo</dt>
              <dd className="font-mono text-xs">
                {inspection.serviceOrder.equipmentCode}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Alcance</dt>
              <dd className="font-medium">{inspection.serviceOrder.scope}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hallazgos
            </p>
            <p className="mt-1 text-sm text-foreground">
              {inspection.technicalDetails ?? 'Sin hallazgos registrados.'}
            </p>
          </div>
          {inspection.rejectionReason && (
            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
                Motivo del rechazo
              </p>
              <p className="mt-1 text-sm text-foreground">{inspection.rejectionReason}</p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Flujo"
          description="La inspección aprobada habilita la hoja de ruta."
        >
          <ol className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="size-3.5" />
              </span>
              ODS recibida de Ventas
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                <ClipboardCheck className="size-3.5" />
              </span>
              Inspección de taller
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <FileText className="size-3.5" />
              </span>
              Hoja de ruta de Ingeniería
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ArrowRight className="size-3.5" />
              </span>
              Ejecución, anexos y calidad
            </li>
          </ol>
          {inspection.status === 'APPROVED' && !previewInspectionExists && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              La creación de hojas de ruta se conectará en la siguiente fase.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Tareas de inspección"
        description="Tareas por etapa, proceso y puesto. Calidad siempre participa."
        actions={
          canEdit ? (
            <Button size="sm" variant="outline" onClick={openAddTask}>
              <Plus /> Agregar tarea
            </Button>
          ) : undefined
        }
      >
        <ApiTaskList
          tasks={inspection.tasks}
          canComplete={(task) => canCompleteTask(authUser, task)}
          onComplete={openComplete}
        />
      </SectionCard>

      <SectionCard title="Historial de la inspección" description="Eventos registrados.">
        {inspectionAudit.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>
        ) : (
          <Timeline
            items={inspectionAudit.map((entry) => ({
              title: `${AUDIT_ACTION_META[entry.action].label} · ${entry.entity}`,
              description: `${entry.userName}: ${entry.detail}`,
              date: formatDateTime(entry.createdAt),
              tone:
                entry.action === 'REJECT' || entry.action === 'DELETE'
                  ? 'danger'
                  : entry.action === 'APPROVE' || entry.action === 'COMPLETE'
                    ? 'success'
                    : 'info',
            }))}
          />
        )}
      </SectionCard>

      <ApiCompleteTaskDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        task={completeTask}
        inspection={inspection}
        pending={completeMutation.isPending}
        onSubmit={(payload) => {
          if (!completeTask) return;
          completeMutation.mutate({ taskId: completeTask.id, payload });
        }}
      />

      <FormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Agregar tarea de inspección"
        description="Se agrega al final de la secuencia. Ajusta la etapa según corresponda."
        className="sm:max-w-5xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                const valid = newTasks.filter(
                  (task) => task.description.trim() && task.jobPositionId,
                );
                if (valid.length === 0) {
                  toast.error('Escribe la descripción de al menos una tarea');
                  return;
                }
                addTasksMutation.mutate(valid);
              }}
              disabled={addTasksMutation.isPending}
            >
              <Plus /> {addTasksMutation.isPending ? 'Agregando…' : 'Agregar'}
            </Button>
          </>
        }
      >
        <ApiTaskBuilder
          tasks={newTasks}
          onChange={setNewTasks}
          defaultStage={Math.max(1, maxStage + 1)}
        />
      </FormDialog>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Aprobar inspección"
        description="La inspección quedará disponible para que Ingeniería cree la hoja de ruta. Los pasos se copiarán como realizados."
        confirmLabel="Aprobar y enviar"
        onConfirm={() => approveMutation.mutate()}
      />

      <FormDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Rechazar inspección"
        description="La inspección vuelve a taller con las tareas pendientes desbloqueadas."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!rejectReason.trim()) {
                  toast.error('Escribe el motivo del rechazo');
                  return;
                }
                rejectMutation.mutate(rejectReason.trim());
              }}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Guardando…' : 'Confirmar rechazo'}
            </Button>
          </>
        }
      >
        <Textarea
          rows={4}
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Ej: Falta evidencia fotográfica de la limpieza."
        />
      </FormDialog>
    </div>
  );
}
