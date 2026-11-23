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
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { InspectionStatusBadge, PriorityBadge } from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { FormDialog } from '@/components/common/form-dialog';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { SectionCard } from '@/components/common/section-card';
import { Timeline } from '@/components/common/timeline';
import { CompleteTaskDialog } from '@/components/tasks/complete-task-dialog';
import { TaskBuilder, createEmptyTask } from '@/components/tasks/task-builder';
import { TaskList } from '@/components/tasks/task-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AUDIT_ACTION_META } from '@/features/preview/config';
import { getInspectionWithRelations, getTaskContexts } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { NewTaskInput, TaskWithContext } from '@/features/preview/types';
import { formatDate, formatDateTime } from '@/lib/formatters';
import {
  canApproveInspection,
  canCompleteTask,
  canEditInspection,
  canManageRoutes,
} from '@/lib/permissions';

export function InspectionDetailPage() {
  const { id } = useParams();
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const completeTask = usePreviewStore((state) => state.completeTask);
  const addInspectionTask = usePreviewStore((state) => state.addInspectionTask);
  const approveInspection = usePreviewStore((state) => state.approveInspection);
  const rejectInspection = usePreviewStore((state) => state.rejectInspection);
  const navigate = useNavigate();

  const [completeContext, setCompleteContext] = useState<TaskWithContext | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [newTasks, setNewTasks] = useState<NewTaskInput[]>([createEmptyTask('rotating', 2)]);

  if (!user) return null;

  const inspection = id ? getInspectionWithRelations(db, id) : undefined;

  if (!inspection) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <EmptyState
          icon={ClipboardCheck}
          title="Inspección no encontrada"
          description="La inspección solicitada no existe o fue eliminada."
          action={
            <Button asChild variant="outline">
              <Link to="/taller/inspecciones">
                <ArrowLeft /> Volver a inspecciones
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const route = db.routeSheets.find((candidate) => candidate.inspectionId === inspection.id);
  const allCompleted = inspection.tasks.every((task) => task.status === 'COMPLETED');
  const inspectionAudit = db.audit
    .filter((entry) =>
      [inspection.code, inspection.id, inspection.serviceOrder.code, inspection.serviceOrder.id].includes(entry.entityId),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const openComplete = (task: TaskWithContext['task']) => {
    const context = getTaskContexts(db).find((candidate) => candidate.task.id === task.id) ?? null;
    setCompleteContext(context);
    setCompleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 text-muted-foreground">
          <Link to="/taller/inspecciones">
            <ArrowLeft /> Volver a inspecciones
          </Link>
        </Button>
        <PageHeader
          eyebrow={`${inspection.serviceOrder.code} · ${inspection.serviceOrder.subCode} · ${inspection.client?.name ?? 'Sin cliente'}`}
          title={inspection.code}
          description={inspection.serviceOrder.description}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <InspectionStatusBadge status={inspection.status} />
              <PriorityBadge priority={inspection.serviceOrder.priority} />
              {canEditInspection(user, inspection) && (
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                  <Plus /> Agregar tarea
                </Button>
              )}
              {canApproveInspection(user) && inspection.status === 'COMPLETED' && allCompleted && (
                <Button size="sm" onClick={() => setApproveOpen(true)}>
                  <CheckCircle2 /> Aprobar inspección
                </Button>
              )}
              {canApproveInspection(user) && ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].includes(inspection.status) && (
                <Button variant="destructive" size="sm" onClick={() => setRejectOpen(true)}>
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
              {!route && inspection.status === 'APPROVED' && canManageRoutes(user) && (
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
              <span>Equipo: <strong className="text-foreground">{inspection.asset?.manufacturer} {inspection.asset?.model}</strong></span>
              <span>Serial: <strong className="text-foreground">{inspection.asset?.serial ?? '—'}</strong></span>
              <span>Entrega: <strong className="text-foreground">{formatDate(inspection.serviceOrder.dueDate)}</strong></span>
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
            <p className="font-medium text-foreground">Creada por</p>
            <p className="text-muted-foreground">{inspection.creator.name}</p>
            <p className="mt-1 font-medium text-foreground">Aprobada por</p>
            <p className="text-muted-foreground">
              {inspection.approver?.name ?? 'Pendiente'}
              {inspection.approvedAt ? ` · ${formatDateTime(inspection.approvedAt)}` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Datos de la ODS" description="Información recibida desde Ventas.">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Cliente</dt><dd className="font-medium">{inspection.client?.name ?? '—'}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Sitio / planta</dt><dd className="font-medium">{inspection.serviceOrder.site}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Código del equipo</dt><dd className="font-mono text-xs">{inspection.serviceOrder.equipmentCode}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Alcance</dt><dd className="font-medium">{inspection.serviceOrder.scope}</dd></div>
          </dl>
          <div className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hallazgos</p>
            <p className="mt-1 text-sm text-foreground">{inspection.findings ?? 'Sin hallazgos registrados.'}</p>
          </div>
        </SectionCard>

        <SectionCard title="Flujo" description="La inspección aprobada habilita la hoja de ruta.">
          <ol className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success"><CheckCircle2 className="size-3.5" /></span>
              ODS recibida de Ventas
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary"><ClipboardCheck className="size-3.5" /></span>
              Inspección de taller
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground"><FileText className="size-3.5" /></span>
              Hoja de ruta de Ingeniería
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground"><ArrowRight className="size-3.5" /></span>
              Ejecución, anexos y calidad
            </li>
          </ol>
        </SectionCard>
      </div>

      <SectionCard
        title="Tareas de inspección"
        description="Tareas por etapa, proceso y puesto. Calidad siempre participa."
        actions={
          canEditInspection(user, inspection) ? (
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
              <Plus /> Agregar tarea
            </Button>
          ) : undefined
        }
      >
        <TaskList
          tasks={inspection.tasks}
          canComplete={(task) => canCompleteTask(user, task)}
          onComplete={(task) => openComplete(task)}
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

      <CompleteTaskDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        context={completeContext}
        onSubmit={(payload) => {
          if (!completeContext) return;
          completeTask(completeContext.task.id, user.id, payload);
          toast.success('Tarea de inspección completada');
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
                const valid = newTasks.filter((task) => task.description.trim());
                if (valid.length === 0) {
                  toast.error('Escribe la descripción de al menos una tarea');
                  return;
                }
                valid.forEach((task) => addInspectionTask(inspection.id, task, user.id));
                setAddOpen(false);
                setNewTasks([createEmptyTask('rotating', 2)]);
                toast.success('Tarea(s) agregada(s) a la inspección');
              }}
            >
              <Plus /> Agregar
            </Button>
          </>
        }
      >
        <TaskBuilder tasks={newTasks} onChange={setNewTasks} defaultStage={2} />
      </FormDialog>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Aprobar inspección"
        description="La inspección quedará disponible para que Ingeniería cree la hoja de ruta. Los pasos se copiarán como realizados."
        confirmLabel="Aprobar y enviar"
        onConfirm={() => {
          approveInspection(inspection.id, user.id);
          toast.success('Inspección aprobada');
          setApproveOpen(false);
          navigate(`/taller/inspecciones/${inspection.id}`);
        }}
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
                rejectInspection(inspection.id, user.id, rejectReason.trim());
                toast.info('Inspección devuelta a taller');
                setRejectOpen(false);
                setRejectReason('');
              }}
            >
              Confirmar rechazo
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
