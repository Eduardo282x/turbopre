import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  Image as ImageIcon,
  Package,
  Pencil,
  Plus,
  Printer,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  InspectionStatusBadge,
  PriorityBadge,
  RouteStatusBadge,
  SpareDestinationBadge,
  SpareItemStatusBadge,
} from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { FormDialog } from '@/components/common/form-dialog';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { SectionCard } from '@/components/common/section-card';
import { Timeline } from '@/components/common/timeline';
import { CompleteTaskDialog } from '@/components/tasks/complete-task-dialog';
import { SpareRequestDialog } from '@/components/tasks/spare-request-dialog';
import { TaskBuilder, createEmptyTask } from '@/components/tasks/task-builder';
import { TaskList } from '@/components/tasks/task-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  AUDIT_ACTION_META,
  POSITION_BY_ID,
  ROUTE_STATUS_META,
  ROUTE_STATUS_ORDER,
} from '@/features/preview/config';
import {
  getRouteSheetWithRelations,
  getTaskContexts,
} from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type {
  NewSpareRequestInput,
  NewTaskInput,
  RouteSheetWithRelations,
  TaskWithContext,
} from '@/features/preview/types';
import { formatDate, formatDateTime } from '@/lib/formatters';
import {
  canApproveQuality,
  canApproveRoute,
  canCompleteTask,
  canDeliverRoute,
  canEditRoute,
  canFinalizeAnnexes,
  canManageRoutes,
  canRequestSparePart,
  canSendRouteToApproval,
} from '@/lib/permissions';

interface AddRouteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStage: number;
  onSubmit: (tasks: NewTaskInput[]) => void;
}

function AddRouteTaskDialog({ open, onOpenChange, defaultStage, onSubmit }: AddRouteTaskDialogProps) {
  const [tasks, setTasks] = useState<NewTaskInput[]>([createEmptyTask('rotating', defaultStage)]);
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Agregar tarea de corrección"
      description="La tarea reabre la hoja si ya estaba en anexos o calidad."
      className="sm:max-w-5xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSubmit(tasks.filter((task) => task.description.trim()));
              onOpenChange(false);
            }}
          >
            <Plus /> Agregar tarea
          </Button>
        </>
      }
    >
      <TaskBuilder tasks={tasks} onChange={setTasks} defaultStage={defaultStage} />
    </FormDialog>
  );
}

function RouteSheetPrint({
  route,
  qualityApprover,
}: {
  route: RouteSheetWithRelations;
  qualityApprover?: string;
}) {
  const users = usePreviewStore((state) => state.db.users);
  const tasks = [...route.tasks].sort((a, b) => a.step - b.step);
  return (
    <div className="print-only bg-white p-6 text-black">
      <div className="flex items-start justify-between gap-6 border-b-2 border-black pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">TurboPre Services</p>
          <h1 className="mt-1 text-lg font-bold">HOJA DE RUTA DEL SERVICIO</h1>
          <p className="text-[11px]">Control Automatizado de Mantenimiento Industrial · CAMI</p>
        </div>
        <div className="text-right text-[11px]">
          <p className="font-semibold">{route.code}</p>
          <p>Versión impresa</p>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse text-[10px]">
        <tbody>
          <tr>
            <td className="w-32 border border-black px-2 py-1 font-semibold">Datos del servicio</td>
            <td className="border border-black px-2 py-1" colSpan={3}>{route.description}</td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 font-semibold">Orden de Servicio N°</td>
            <td className="border border-black px-2 py-1">{route.serviceOrder.code} ({route.serviceOrder.subCode})</td>
            <td className="w-20 border border-black px-2 py-1 font-semibold">Serial</td>
            <td className="border border-black px-2 py-1">{route.serial}</td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 font-semibold">Cliente</td>
            <td className="border border-black px-2 py-1">{route.client?.name ?? '—'}</td>
            <td className="border border-black px-2 py-1 font-semibold">Equipo</td>
            <td className="border border-black px-2 py-1">
              {route.asset?.manufacturer} {route.asset?.model} · {route.equipmentCode}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 font-semibold">Sitio / planta</td>
            <td className="border border-black px-2 py-1">{route.site}</td>
            <td className="border border-black px-2 py-1 font-semibold">Fecha compromiso</td>
            <td className="border border-black px-2 py-1">{formatDate(route.dueDate)}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="mt-4 text-[11px] font-bold uppercase">Responsables y firmas aprobatorias</h2>
      <table className="mt-1 w-full border-collapse text-[10px]">
        <tbody>
          <tr>
            <td className="w-24 border border-black px-2 py-1 font-semibold">Realizado por</td>
            <td className="border border-black px-2 py-1">{route.creator.name}</td>
            <td className="w-24 border border-black px-2 py-1 font-semibold">Cargo</td>
            <td className="border border-black px-2 py-1">Ingeniería y Soporte Técnico</td>
            <td className="w-24 border border-black px-2 py-1 font-semibold">Fecha</td>
            <td className="border border-black px-2 py-1">{formatDate(route.preparedAt)}</td>
            <td className="w-20 border border-black px-2 py-1 font-semibold">Firma</td>
            <td className="border border-black px-2 py-1" />
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 font-semibold">Aprobado por</td>
            <td className="border border-black px-2 py-1">{route.approver?.name ?? 'Pendiente'}</td>
            <td className="border border-black px-2 py-1 font-semibold">Cargo</td>
            <td className="border border-black px-2 py-1">Gerencia / Coordinación</td>
            <td className="border border-black px-2 py-1 font-semibold">Fecha</td>
            <td className="border border-black px-2 py-1">{route.approvedAt ? formatDate(route.approvedAt) : 'Pendiente'}</td>
            <td className="border border-black px-2 py-1 font-semibold">Firma</td>
            <td className="border border-black px-2 py-1" />
          </tr>
        </tbody>
      </table>

      <h2 className="mt-4 text-[11px] font-bold uppercase">Secuencia de trabajo</h2>
      <table className="mt-1 w-full border-collapse text-[9px]">
        <thead>
          <tr className="bg-black/10">
            <th className="w-14 border border-black px-1 py-1 text-left">Paso N°</th>
            <th className="w-40 border border-black px-1 py-1 text-left">Responsable</th>
            <th className="border border-black px-1 py-1 text-left">Descripción de la Actividad</th>
            <th className="w-24 border border-black px-1 py-1 text-left">Criterio</th>
            <th className="w-24 border border-black px-1 py-1 text-left">Formularios</th>
            <th className="w-24 border border-black px-1 py-1 text-left">Firma / Fecha</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="break-inside-avoid">
              <td className="border border-black px-1 py-1">{task.step}</td>
              <td className="border border-black px-1 py-1">{POSITION_BY_ID[task.positionId]?.name ?? task.positionId}</td>
              <td className="border border-black px-1 py-1">{task.description}</td>
              <td className="border border-black px-1 py-1">{task.criteria ?? 'N/A'}</td>
              <td className="border border-black px-1 py-1">{task.forms ?? 'N/A'}</td>
              <td className="border border-black px-1 py-1">
                {task.completedAt ? `✓ ${formatDate(task.completedAt)}` : 'Pendiente'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-[11px] font-bold uppercase">Observaciones</h2>
          <table className="mt-1 w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-black/10">
                <th className="w-14 border border-black px-1 py-1 text-left">Paso N°</th>
                <th className="border border-black px-1 py-1 text-left">Descripción</th>
                <th className="w-20 border border-black px-1 py-1 text-left">Nombre</th>
              </tr>
            </thead>
            <tbody>
              {tasks.filter((task) => task.observations).length === 0 ? (
                <tr>
                  <td className="border border-black px-1 py-3 text-center" colSpan={3}>
                    Sin observaciones registradas.
                  </td>
                </tr>
              ) : (
                tasks
                  .filter((task) => task.observations)
                  .map((task) => (
                    <tr key={task.id}>
                      <td className="border border-black px-1 py-1">{task.step}</td>
                      <td className="border border-black px-1 py-1">{task.observations}</td>
                      <td className="border border-black px-1 py-1">
                        {users.find((candidate) => candidate.id === task.completedBy)?.name ?? '—'}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="text-[11px] font-bold uppercase">Revisado por Control de Calidad</h2>
          <table className="mt-1 w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-black/10">
                <th className="border border-black px-1 py-1 text-left">Nombre y Apellido</th>
                <th className="w-32 border border-black px-1 py-1 text-left">Fecha / Firma</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-1 py-4">{qualityApprover ?? 'Pendiente'}</td>
                <td className="border border-black px-1 py-4">
                  {route.qualityApprovedAt ? formatDate(route.qualityApprovedAt) : 'Pendiente'}
                </td>
              </tr>
            </tbody>
          </table>
          {route.observations && (
            <p className="mt-2 text-[9px]">
              <strong>Observaciones generales:</strong> {route.observations}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function RouteSheetDetailPage() {
  const { id } = useParams();
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const completeTask = usePreviewStore((state) => state.completeTask);
  const sendRouteToApproval = usePreviewStore((state) => state.sendRouteToApproval);
  const approveRouteSheet = usePreviewStore((state) => state.approveRouteSheet);
  const rejectRouteSheet = usePreviewStore((state) => state.rejectRouteSheet);
  const addRouteTask = usePreviewStore((state) => state.addRouteTask);
  const toggleAnnex = usePreviewStore((state) => state.toggleAnnex);
  const finalizeAnnexes = usePreviewStore((state) => state.finalizeAnnexes);
  const approveQuality = usePreviewStore((state) => state.approveQuality);
  const rejectQuality = usePreviewStore((state) => state.rejectQuality);
  const deliverRouteSheet = usePreviewStore((state) => state.deliverRouteSheet);
  const deleteRouteSheet = usePreviewStore((state) => state.deleteRouteSheet);
  const createSpareRequest = usePreviewStore((state) => state.createSpareRequest);
  const navigate = useNavigate();

  const [tab, setTab] = useState('resumen');
  const [completeContext, setCompleteContext] = useState<TaskWithContext | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [spareOpen, setSpareOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | 'approve' | 'annex' | 'quality' | 'deliver' | 'delete'>(null);
  const [rejectKind, setRejectKind] = useState<null | 'route' | 'quality'>(null);
  const [rejectReason, setRejectReason] = useState('');

  if (!user) return null;

  const route = id ? getRouteSheetWithRelations(db, id) : undefined;

  if (!route) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <EmptyState
          icon={FileText}
          title="Hoja de ruta no encontrada"
          description="La hoja solicitada no existe o fue eliminada."
          action={
            <Button asChild variant="outline">
              <Link to="/hojas-de-ruta">
                <ArrowLeft /> Volver al listado
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const currentStatusIndex = ROUTE_STATUS_ORDER.indexOf(route.status);
  const routeAudit = db.audit
    .filter((entry) =>
      [route.code, route.id, route.serviceOrder.code, route.serviceOrder.id, route.inspection.code, route.inspection.id].includes(
        entry.entityId,
      ),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const annexTasks = route.tasks.filter((task) => task.annexSelected && task.evidence);
  const tasksWithEvidence = route.tasks.filter((task) => task.evidence);

  const openComplete = (task: TaskWithContext['task']) => {
    const context = getTaskContexts(db).find((candidate) => candidate.task.id === task.id) ?? null;
    setCompleteContext(context);
    setCompleteOpen(true);
  };

  const confirmLabels: Record<NonNullable<typeof confirmAction>, { title: string; description: string; label: string }> = {
    approve: {
      title: 'Aprobar hoja de ruta',
      description: `La hoja ${route.code} pasará a En ejecución y se desbloqueará la primera etapa.`,
      label: 'Aprobar y liberar',
    },
    annex: {
      title: 'Finalizar anexos',
      description: 'Calidad recibirá la hoja con las evidencias seleccionadas.',
      label: 'Enviar a Calidad',
    },
    quality: {
      title: 'Dar visto bueno de Calidad',
      description: 'La hoja quedará lista para entrega.',
      label: 'Dar visto bueno',
    },
    deliver: {
      title: 'Confirmar entrega',
      description: 'La hoja se marcará como entregada al cliente.',
      label: 'Confirmar entrega',
    },
    delete: {
      title: 'Eliminar hoja de ruta',
      description: 'Se eliminarán la hoja, sus tareas y sus solicitudes de repuestos. No se puede deshacer.',
      label: 'Sí, eliminar',
    },
  };

  const runConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction === 'approve') {
      approveRouteSheet(route.id, user.id);
      toast.success('Hoja aprobada y liberada a taller');
    }
    if (confirmAction === 'annex') {
      finalizeAnnexes(route.id, user.id);
      toast.success('Anexos enviados a Calidad');
    }
    if (confirmAction === 'quality') {
      approveQuality(route.id, user.id);
      toast.success('Visto bueno de Calidad registrado');
    }
    if (confirmAction === 'deliver') {
      deliverRouteSheet(route.id, user.id);
      toast.success('Entrega confirmada');
    }
    if (confirmAction === 'delete') {
      deleteRouteSheet(route.id, user.id);
      toast.info('Hoja de ruta eliminada');
      navigate('/hojas-de-ruta', { replace: true });
    }
    setConfirmAction(null);
  };

  const qualityApprover = db.users.find((candidate) => candidate.id === route.qualityApprovedBy)?.name;

  return (
    <>
      <div className="screen-only space-y-6">
      <div className="no-print">
        <Button variant="ghost" size="sm" asChild className="mb-3 text-muted-foreground">
          <Link to="/hojas-de-ruta">
            <ArrowLeft /> Volver a hojas de ruta
          </Link>
        </Button>
        <PageHeader
          eyebrow={`${route.serviceOrder.code} · ${route.serviceOrder.subCode} · ${route.client?.name ?? 'Sin cliente'}`}
          title={`${route.code} · ${route.asset?.manufacturer} ${route.asset?.model}`}
          description={route.description}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <RouteStatusBadge status={route.status} />
              <PriorityBadge priority={route.priority} />
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer /> Imprimir
              </Button>
              {canEditRoute(user, route) && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/hojas-de-ruta/nueva?id=${route.id}`)}>
                  <Pencil /> Editar cabezal
                </Button>
              )}
              {canSendRouteToApproval(user, route) && (
                <Button
                  size="sm"
                  onClick={() => {
                    if (route.tasks.filter((task) => task.source === 'ROUTE').length === 0) {
                      toast.error('Agrega al menos una tarea antes de enviar a aprobación');
                      return;
                    }
                    sendRouteToApproval(route.id, user.id);
                    toast.success('Hoja enviada al Gerente');
                  }}
                >
                  <Send /> Enviar a aprobación
                </Button>
              )}
              {canApproveRoute(user, route) && (
                <>
                  <Button size="sm" onClick={() => setConfirmAction('approve')}>
                    <CheckCircle2 /> Aprobar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setRejectKind('route')}>
                    <XCircle /> Rechazar
                  </Button>
                </>
              )}
              {canApproveQuality(user, route) && (
                <>
                  <Button size="sm" onClick={() => setConfirmAction('quality')}>
                    <ShieldCheck /> Dar visto bueno
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setRejectKind('quality')}>
                    <XCircle /> Rechazar
                  </Button>
                </>
              )}
              {canFinalizeAnnexes(user, route) && (
                <Button size="sm" onClick={() => setConfirmAction('annex')}>
                  <CheckCircle2 /> Finalizar anexos
                </Button>
              )}
              {canDeliverRoute(user, route) && (
                <Button size="sm" onClick={() => setConfirmAction('deliver')}>
                  <Package /> Confirmar entrega
                </Button>
              )}
              {canManageRoutes(user) && route.status === 'DRAFT' && (
                <Button variant="destructive" size="sm" onClick={() => setConfirmAction('delete')}>
                  <Trash2 /> Eliminar
                </Button>
              )}
            </div>
          }
        />
      </div>

      <Card className="border-border/80 bg-card/80 py-0">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {ROUTE_STATUS_ORDER.map((status, index) => {
              const meta = ROUTE_STATUS_META[status];
              const done = index < currentStatusIndex;
              const active = index === currentStatusIndex;
              return (
                <div key={status} className="flex items-center gap-2">
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      done
                        ? 'bg-success text-success-foreground'
                        : active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {done ? '✓' : index + 1}
                  </span>
                  <span className={active ? 'text-xs font-semibold text-foreground' : 'text-xs text-muted-foreground'}>
                    {meta.shortLabel}
                  </span>
                  {index < ROUTE_STATUS_ORDER.length - 1 && <span className="mx-1 h-px w-4 bg-border" />}
                </div>
              );
            })}
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_280px]">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Cliente: <strong className="text-foreground">{route.client?.name ?? 'Sin cliente'}</strong></span>
                <span>·</span>
                <span>Serial: <strong className="text-foreground">{route.serial}</strong></span>
                <span>·</span>
                <span>Entrega: <strong className="text-foreground">{formatDate(route.dueDate)}</strong></span>
              </div>
              <ProgressBar value={route.progress} label={`${route.completedTasks} de ${route.totalTasks} tareas completadas`} />
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
              <p className="font-medium text-foreground">Etapa actual</p>
              <p className="text-muted-foreground">
                {route.currentStage ? `Etapa ${route.currentStage}` : 'Sin etapa activa'}
              </p>
              <p className="mt-1 font-medium text-foreground">Proceso activo</p>
              <p className="text-muted-foreground">{route.activeProcess?.name ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="no-print flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
          <TabsTrigger value="resumen"><FileText /> Cabezal</TabsTrigger>
          <TabsTrigger value="tareas"><ClipboardCheck /> Tareas ({route.tasks.length})</TabsTrigger>
          <TabsTrigger value="repuestos"><Package /> Repuestos ({route.spareRequests.length})</TabsTrigger>
          <TabsTrigger value="anexos"><ImageIcon /> Anexos ({annexTasks.length})</TabsTrigger>
          <TabsTrigger value="calidad"><ShieldCheck /> Calidad</TabsTrigger>
          <TabsTrigger value="auditoria"><History /> Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Datos del servicio" description="Cabezal de la hoja de ruta.">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted-foreground">ODS principal</dt><dd className="font-mono text-xs">{route.serviceOrder.code}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Sub-ODS</dt><dd className="font-mono text-xs">{route.serviceOrder.subCode}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Equipo</dt><dd className="font-medium">{route.asset?.manufacturer} {route.asset?.model}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Código del equipo</dt><dd className="font-mono text-xs">{route.equipmentCode}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Serial</dt><dd className="font-mono text-xs">{route.serial}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Sitio / planta</dt><dd className="font-medium">{route.site}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Alcance</dt><dd className="font-medium">{route.scope}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Fecha compromiso</dt><dd className="font-medium">{formatDate(route.dueDate)}</dd></div>
              </dl>
            </SectionCard>

            <SectionCard title="Responsables y firmas" description="Trazabilidad de la hoja de ruta.">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted-foreground">Realizado por</dt><dd className="font-medium">{route.creator.name}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Fecha</dt><dd className="font-medium">{formatDateTime(route.preparedAt)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Aprobado por</dt><dd className="font-medium">{route.approver?.name ?? 'Pendiente'}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Fecha</dt><dd className="font-medium">{route.approvedAt ? formatDateTime(route.approvedAt) : 'Pendiente'}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Anexos</dt><dd className="font-medium">{route.annexFinalizedAt ? formatDateTime(route.annexFinalizedAt) : 'Pendiente'}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Calidad</dt><dd className="font-medium">{route.qualityApprovedAt ? formatDateTime(route.qualityApprovedAt) : 'Pendiente'}</dd></div>
              </dl>
              {route.observations && (
                <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-warning">Observaciones</p>
                  <p className="mt-1 text-foreground">{route.observations}</p>
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Inspección de origen" description="Los primeros pasos de la hoja ya estaban realizados.">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{route.inspection.code}</p>
                <p className="text-xs text-muted-foreground">{route.inspection.findings ?? 'Sin hallazgos registrados.'}</p>
              </div>
              <InspectionStatusBadge status={route.inspection.status} />
            </div>
            <Button variant="outline" size="sm" asChild className="mt-3">
              <Link to={`/taller/inspecciones/${route.inspection.id}`}>
                Ver inspección <ArrowLeft className="rotate-180" />
              </Link>
            </Button>
          </SectionCard>
        </TabsContent>

        <TabsContent value="tareas" className="mt-4">
          <SectionCard
            title="Tareas por etapa"
            description="La hoja se ve completa. Solo la tarea de tu puesto y de la etapa activa se puede marcar como lista."
            actions={
              canManageRoutes(user) && ['DRAFT', 'IN_PROGRESS', 'IN_ANNEXES', 'IN_QUALITY'].includes(route.status) ? (
                <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}>
                  <Plus /> Agregar tarea de corrección
                </Button>
              ) : undefined
            }
          >
            <TaskList
              tasks={route.tasks}
              canComplete={(task) => canCompleteTask(user, task)}
              onComplete={(task) => openComplete(task)}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="repuestos" className="mt-4">
          <SectionCard
            title="Solicitudes de repuestos"
            description="Una solicitud puede incluir varios ítems. Si no hay stock, se envía a Procura."
            actions={
              canRequestSparePart(user) && route.status !== 'DELIVERED' ? (
                <Button size="sm" onClick={() => setSpareOpen(true)}>
                  <Plus /> Solicitar repuestos
                </Button>
              ) : undefined
            }
          >
            {route.spareRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay solicitudes de repuestos para esta hoja.</p>
            ) : (
              <div className="space-y-3">
                {route.spareRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-border/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{request.code}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Solicitada el {formatDate(request.requestedAt)} · {request.notes ?? 'Sin observaciones'}
                        </p>
                      </div>
                      <Badge variant="outline">{request.items.length} ítem(s)</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {request.items.map((item) => (
                        <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">
                              {item.quantity}× {item.name}
                            </p>
                            <p className="font-mono text-muted-foreground">{item.code}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <SpareDestinationBadge destination={item.destination} />
                            <SpareItemStatusBadge status={item.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="anexos" className="mt-4">
          <SectionCard
            title="Anexos y evidencias"
            description="Ingeniería selecciona las fotos que acompañan la hoja. Calidad revisa los anexos seleccionados."
            actions={
              canFinalizeAnnexes(user, route) ? (
                <Button size="sm" onClick={() => setConfirmAction('annex')}>
                  <CheckCircle2 /> Finalizar anexos
                </Button>
              ) : undefined
            }
          >
            {tasksWithEvidence.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="Sin evidencias todavía"
                description="Las fotos cargadas al completar tareas aparecerán aquí."
              />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {tasksWithEvidence.map((task) => (
                    <figure key={task.id} className="overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                      <img src={task.evidence} alt={`Evidencia de ${task.description}`} className="h-36 w-full object-cover" />
                      <figcaption className="space-y-1 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground">Paso {task.step}</p>
                          <Badge variant={task.annexSelected ? 'default' : 'outline'}>
                            {task.annexSelected ? 'Incluida' : 'Excluida'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{task.description}</p>
                        {task.observations && <p className="text-foreground">{task.observations}</p>}
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <div className="rounded-xl border border-border/70 p-3">
                  <TaskList
                    tasks={route.tasks}
                    annexEditable={Boolean(canFinalizeAnnexes(user, route))}
                    onToggleAnnex={(task, selected) => toggleAnnex(task.id, selected, user.id)}
                  />
                </div>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="calidad" className="mt-4">
          <SectionCard
            title="Visto bueno de Calidad"
            description="Revisa observaciones y evidencias seleccionadas antes de liberar la hoja."
            actions={
              canApproveQuality(user, route) ? (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setConfirmAction('quality')}>
                    <ShieldCheck /> Dar visto bueno
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setRejectKind('quality')}>
                    <XCircle /> Rechazar
                  </Button>
                </div>
              ) : undefined
            }
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observaciones</p>
                  <p className="mt-1 text-sm text-foreground">{route.observations ?? 'Sin observaciones registradas.'}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Anexos seleccionados</p>
                  <p className="mt-1 text-sm text-foreground">{annexTasks.length} evidencia(s) seleccionada(s).</p>
                </div>
                {!canApproveQuality(user, route) && (
                  <p className="text-xs text-muted-foreground">
                    Esta hoja está en estado <strong>{ROUTE_STATUS_META[route.status].label}</strong>.
                    El visto bueno se habilita cuando Ingeniería finaliza los anexos.
                  </p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {annexTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay evidencias seleccionadas.</p>
                ) : (
                  annexTasks.map((task) => (
                    <figure key={task.id} className="overflow-hidden rounded-xl border border-border/70">
                      <img src={task.evidence} alt={`Anexo de ${task.description}`} className="h-32 w-full object-cover" />
                      <figcaption className="p-2 text-[11px] text-muted-foreground">
                        Paso {task.step} · {task.description}
                      </figcaption>
                    </figure>
                  ))
                )}
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="auditoria" className="mt-4">
          <SectionCard title="Historial de la hoja" description="Eventos registrados en la ODS, inspección y hoja de ruta.">
            {routeAudit.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>
            ) : (
              <Timeline
                items={routeAudit.map((entry) => ({
                  title: `${AUDIT_ACTION_META[entry.action].label} · ${entry.entity}`,
                  description: `${entry.userName}: ${entry.detail}`,
                  date: formatDateTime(entry.createdAt),
                  tone:
                    entry.action === 'REJECT' || entry.action === 'DELETE'
                      ? 'danger'
                      : entry.action === 'APPROVE' || entry.action === 'COMPLETE' || entry.action === 'DELIVER'
                        ? 'success'
                        : 'info',
                }))}
              />
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      <CompleteTaskDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        context={completeContext}
        onSubmit={(payload) => {
          if (!completeContext) return;
          completeTask(completeContext.task.id, user.id, payload);
          toast.success('Tarea marcada como lista. La etapa siguiente se desbloqueó.');
        }}
      />

      <SpareRequestDialog
        open={spareOpen}
        onOpenChange={setSpareOpen}
        onSubmit={(input: NewSpareRequestInput) => {
          createSpareRequest(route.id, input, user.id);
          toast.success('Solicitud de repuestos enviada');
        }}
      />

      <AddRouteTaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        defaultStage={route.currentStage ?? 1}
        onSubmit={(tasks) => {
          tasks.forEach((task) => addRouteTask(route.id, task, user.id));
          toast.success('Tarea(s) de corrección agregada(s)');
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={confirmAction ? confirmLabels[confirmAction].title : ''}
        description={confirmAction ? confirmLabels[confirmAction].description : ''}
        confirmLabel={confirmAction ? confirmLabels[confirmAction].label : 'Confirmar'}
        destructive={confirmAction === 'delete'}
        onConfirm={runConfirm}
      />

      <FormDialog
        open={Boolean(rejectKind)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectKind(null);
            setRejectReason('');
          }
        }}
        title={rejectKind === 'quality' ? 'Rechazar por Calidad' : 'Devolver a Ingeniería'}
        description="Escribe el motivo para que el área responsable pueda corregirlo."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setRejectKind(null)}>
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
                if (rejectKind === 'quality') {
                  rejectQuality(route.id, user.id, rejectReason.trim());
                } else if (rejectKind === 'route') {
                  rejectRouteSheet(route.id, user.id, rejectReason.trim());
                }
                toast.info('Hoja devuelta con observaciones');
                setRejectKind(null);
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
          placeholder="Ej: Falta la firma del responsable en el paso 40."
        />
      </FormDialog>
      </div>
      <RouteSheetPrint route={route} qualityApprover={qualityApprover} />
    </>
  );
}
