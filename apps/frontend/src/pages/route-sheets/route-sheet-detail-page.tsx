import type {
  AttachmentType,
  CompleteTaskInput,
  CreateTaskInput,
  ReviewDecision,
  ReviewStage,
  RouteSheetRecord,
  RouteSheetStatus,
  TaskRecord,
} from '@turbopre/shared';
import {
  canApproveQuality,
  canApproveRoute,
  canCompleteTask,
  canFinalizeAnnexes,
  canSendRouteToApproval,
} from '@turbopre/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  ApiRouteStatusBadge,
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
import {
  ApiTaskBuilder,
  createEmptyApiTask,
} from '@/components/tasks/api-task-builder';
import { ApiTaskList } from '@/components/tasks/api-task-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { useRouteSheet } from '@/hooks/use-route-sheets';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate, formatDateTime } from '@/lib/formatters';
import {
  ROUTE_SHEET_STATUS_META,
  ROUTE_SHEET_STATUS_ORDER,
} from '@/lib/route-status';
import { catalogsService } from '@/services/catalogs/catalogs.service';
import { routeSheetsService } from '@/services/route-sheets/route-sheets.service';
import { serviceOrdersService } from '@/services/service-orders/service-orders.service';
import { tasksService } from '@/services/tasks/tasks.service';
import { useAuthStore } from '@/stores/use-auth-store';

const REVIEW_STAGE_LABEL: Record<ReviewStage, string> = {
  MANAGER_APPROVAL: 'Aprobación de Gerencia',
  ANNEX_REVIEW: 'Revisión de anexos',
  QUALITY_APPROVAL: 'Visto bueno de Calidad',
};

const REVIEW_DECISION_LABEL: Record<ReviewDecision, string> = {
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  CHANGES_REQUESTED: 'Cambios solicitados',
};

const DOCUMENT_TYPE_LABEL: Record<AttachmentType, string> = {
  PHOTO: 'Foto',
  PDF: 'PDF',
  PLAN: 'Plano',
  CERTIFICATE: 'Certificado',
  OTHER: 'Otro',
};

const ACTIVE_EXECUTION: RouteSheetStatus[] = ['RELEASED', 'IN_PROGRESS'];

interface AddRouteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStage: number;
  pending: boolean;
  onSubmit: (tasks: CreateTaskInput[]) => void;
}

function AddRouteTaskDialog({
  open,
  onOpenChange,
  defaultStage,
  pending,
  onSubmit,
}: AddRouteTaskDialogProps) {
  const catalogsQuery = useQuery({
    queryKey: ['catalogs', 'organization'],
    queryFn: () => catalogsService.getOrganization(),
    staleTime: 5 * 60_000,
  });
  const [tasks, setTasks] = useState<CreateTaskInput[]>([]);

  useEffect(() => {
    if (open) {
      setTasks([createEmptyApiTask(catalogsQuery.data, defaultStage)]);
    }
  }, [open, defaultStage, catalogsQuery.data]);

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
            disabled={pending}
            onClick={() => {
              const valid = tasks.filter(
                (task) => task.description.trim() && task.jobPositionId,
              );
              if (valid.length === 0) {
                toast.error('Agrega al menos una tarea con descripción y puesto');
                return;
              }
              onSubmit(valid);
              onOpenChange(false);
            }}
          >
            <Plus /> {pending ? 'Agregando…' : 'Agregar tarea'}
          </Button>
        </>
      }
    >
      <ApiTaskBuilder
        tasks={tasks}
        onChange={setTasks}
        defaultStage={defaultStage}
      />
    </FormDialog>
  );
}

function RouteSheetPrint({ route }: { route: RouteSheetRecord }) {
  const tasks = [...route.tasks].sort(
    (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0),
  );
  const qualityReview = route.reviews.find(
    (review) => review.stage === 'QUALITY_APPROVAL',
  );
  const managerReview = route.reviews.find(
    (review) => review.stage === 'MANAGER_APPROVAL',
  );

  return (
    <div className="print-only bg-white p-6 text-black">
      <div className="flex items-start justify-between gap-6 border-b-2 border-black pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
            TurboPre Services
          </p>
          <h1 className="mt-1 text-lg font-bold">HOJA DE RUTA DEL SERVICIO</h1>
          <p className="text-[11px]">
            Control Automatizado de Mantenimiento Industrial · CAMI
          </p>
        </div>
        <div className="text-right text-[11px]">
          <p className="font-semibold">{route.code}</p>
          <p>{ROUTE_SHEET_STATUS_META[route.status].label}</p>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse text-[10px]">
        <tbody>
          <tr>
            <td className="w-32 border border-black px-2 py-1 font-semibold">
              Datos del servicio
            </td>
            <td className="border border-black px-2 py-1" colSpan={3}>
              {route.serviceOrder.description}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 font-semibold">
              Orden de Servicio N°
            </td>
            <td className="border border-black px-2 py-1">
              {route.serviceOrder.orderNumber}
            </td>
            <td className="w-20 border border-black px-2 py-1 font-semibold">Serial</td>
            <td className="border border-black px-2 py-1">
              {route.serviceOrder.equipmentSerial ?? '—'}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 font-semibold">Cliente</td>
            <td className="border border-black px-2 py-1">
              {route.serviceOrder.clientName}
            </td>
            <td className="border border-black px-2 py-1 font-semibold">Equipo</td>
            <td className="border border-black px-2 py-1">
              {route.serviceOrder.equipmentName} · {route.serviceOrder.equipmentCode}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 font-semibold">
              Sitio / planta
            </td>
            <td className="border border-black px-2 py-1">
              {route.serviceOrder.siteName}
            </td>
            <td className="border border-black px-2 py-1 font-semibold">
              Fecha compromiso
            </td>
            <td className="border border-black px-2 py-1">
              {route.serviceOrder.dueAt ? formatDate(route.serviceOrder.dueAt) : '—'}
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className="mt-4 text-[11px] font-bold uppercase">
        Responsables y firmas aprobatorias
      </h2>
      <table className="mt-1 w-full border-collapse text-[10px]">
        <tbody>
          <tr>
            <td className="w-24 border border-black px-2 py-1 font-semibold">
              Realizado por
            </td>
            <td className="border border-black px-2 py-1">{route.createdBy.name}</td>
            <td className="w-24 border border-black px-2 py-1 font-semibold">Cargo</td>
            <td className="border border-black px-2 py-1">
              Ingeniería y Soporte Técnico
            </td>
            <td className="w-24 border border-black px-2 py-1 font-semibold">Fecha</td>
            <td className="border border-black px-2 py-1">
              {formatDate(route.createdAt)}
            </td>
            <td className="w-20 border border-black px-2 py-1 font-semibold">Firma</td>
            <td className="border border-black px-2 py-1" />
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 font-semibold">
              Aprobado por
            </td>
            <td className="border border-black px-2 py-1">
              {managerReview?.reviewer.name ?? 'Pendiente'}
            </td>
            <td className="border border-black px-2 py-1 font-semibold">Cargo</td>
            <td className="border border-black px-2 py-1">
              Gerencia / Coordinación
            </td>
            <td className="border border-black px-2 py-1 font-semibold">Fecha</td>
            <td className="border border-black px-2 py-1">
              {managerReview ? formatDate(managerReview.createdAt) : 'Pendiente'}
            </td>
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
            <th className="border border-black px-1 py-1 text-left">
              Descripción de la Actividad
            </th>
            <th className="w-24 border border-black px-1 py-1 text-left">Criterio</th>
            <th className="w-24 border border-black px-1 py-1 text-left">Formularios</th>
            <th className="w-24 border border-black px-1 py-1 text-left">Firma / Fecha</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="break-inside-avoid">
              <td className="border border-black px-1 py-1">{task.sequence ?? '—'}</td>
              <td className="border border-black px-1 py-1">{task.jobPositionName}</td>
              <td className="border border-black px-1 py-1">{task.description}</td>
              <td className="border border-black px-1 py-1">{task.criteria ?? 'N/A'}</td>
              <td className="border border-black px-1 py-1">{task.formRef ?? 'N/A'}</td>
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
          <p className="mt-1 border border-black p-2 text-[9px]">
            {route.notes ?? 'Sin observaciones registradas.'}
          </p>
        </div>
        <div>
          <h2 className="text-[11px] font-bold uppercase">
            Revisado por Control de Calidad
          </h2>
          <table className="mt-1 w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-black/10">
                <th className="border border-black px-1 py-1 text-left">
                  Nombre y Apellido
                </th>
                <th className="w-32 border border-black px-1 py-1 text-left">
                  Fecha / Firma
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-1 py-4">
                  {qualityReview?.reviewer.name ?? 'Pendiente'}
                </td>
                <td className="border border-black px-1 py-4">
                  {qualityReview ? formatDate(qualityReview.createdAt) : 'Pendiente'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function RouteSheetDetailPage() {
  const { id } = useParams();
  const user = useCurrentUser();
  const authUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const routeQuery = useRouteSheet(id);
  const route = routeQuery.data;

  const [tab, setTab] = useState('resumen');
  const [completeTask, setCompleteTask] = useState<TaskRecord | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    null | 'approve' | 'annex' | 'quality' | 'deliver'
  >(null);
  const [rejectKind, setRejectKind] = useState<null | 'route' | 'annex' | 'quality'>(
    null,
  );
  const [rejectReason, setRejectReason] = useState('');

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['route-sheets'] });
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    void queryClient.invalidateQueries({ queryKey: ['service-orders'] });
  };

  const completeMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: CompleteTaskInput }) =>
      tasksService.complete(taskId, payload),
    onSuccess: () => {
      invalidate();
      toast.success('Tarea marcada como lista. La etapa siguiente se desbloqueó.');
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
      if (!route) return;
      for (const task of tasks) {
        await routeSheetsService.addTask(route.id, task);
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success('Tarea(s) de corrección agregada(s)');
      setTaskOpen(false);
    },
    onError: (error) =>
      toast.error('No se pudieron agregar las tareas', {
        description: getApiErrorMessage(error),
      }),
  });

  const submitMutation = useMutation({
    mutationFn: () => routeSheetsService.submit(route?.id as string),
    onSuccess: () => {
      invalidate();
      toast.success('Hoja enviada al Gerente');
    },
    onError: (error) =>
      toast.error('No se pudo enviar la hoja', {
        description: getApiErrorMessage(error),
      }),
  });

  const approveMutation = useMutation({
    mutationFn: () => routeSheetsService.approve(route?.id as string),
    onSuccess: () => {
      invalidate();
      toast.success('Hoja aprobada y liberada a taller');
      setConfirmAction(null);
    },
    onError: (error) =>
      toast.error('No se pudo aprobar la hoja', {
        description: getApiErrorMessage(error),
      }),
  });

  const annexMutation = useMutation({
    mutationFn: () => routeSheetsService.finalizeAnnexes(route?.id as string),
    onSuccess: () => {
      invalidate();
      toast.success('Anexos enviados a Calidad');
      setConfirmAction(null);
    },
    onError: (error) =>
      toast.error('No se pudieron finalizar los anexos', {
        description: getApiErrorMessage(error),
      }),
  });

  const qualityMutation = useMutation({
    mutationFn: () => routeSheetsService.approveQuality(route?.id as string),
    onSuccess: () => {
      invalidate();
      toast.success('Visto bueno de Calidad registrado');
      setConfirmAction(null);
    },
    onError: (error) =>
      toast.error('No se pudo registrar el visto bueno', {
        description: getApiErrorMessage(error),
      }),
  });

  const deliverMutation = useMutation({
    mutationFn: () => serviceOrdersService.deliver(route?.serviceOrder.id as string),
    onSuccess: () => {
      invalidate();
      toast.success('Entrega confirmada');
      setConfirmAction(null);
    },
    onError: (error) =>
      toast.error('No se pudo confirmar la entrega', {
        description: getApiErrorMessage(error),
      }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ kind, reason }: { kind: 'route' | 'annex' | 'quality'; reason: string }) => {
      if (!route) return;
      if (kind === 'route') return routeSheetsService.reject(route.id, { reason });
      if (kind === 'annex') {
        return routeSheetsService.requestAnnexChanges(route.id, { reason });
      }
      return routeSheetsService.rejectQuality(route.id, { reason });
    },
    onSuccess: () => {
      invalidate();
      toast.info('Hoja devuelta con observaciones');
      setRejectKind(null);
      setRejectReason('');
    },
    onError: (error) =>
      toast.error('No se pudo devolver la hoja', {
        description: getApiErrorMessage(error),
      }),
  });

  const toggleAnnexMutation = useMutation({
    mutationFn: ({ taskId, selected }: { taskId: string; selected: boolean }) =>
      routeSheetsService.toggleAnnex(route?.id as string, taskId, { selected }),
    onSuccess: () => {
      invalidate();
    },
    onError: (error) =>
      toast.error('No se pudo actualizar el anexo', {
        description: getApiErrorMessage(error),
      }),
  });

  if (!user || !authUser) return null;

  if (routeQuery.isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Cargando hoja de ruta…
      </div>
    );
  }

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

  const currentStatusIndex = ROUTE_SHEET_STATUS_ORDER.indexOf(route.status);
  const annexTasks = route.tasks.filter(
    (task) => task.annexSelected && task.evidenceUrl,
  );
  const tasksWithEvidence = route.tasks.filter((task) => task.evidenceUrl);
  const canExecute = ACTIVE_EXECUTION.includes(route.status);
  const canSend = canSendRouteToApproval(authUser.role, route.status);
  const canApprove = canApproveRoute(authUser.role, route.status);
  const canAnnex = canFinalizeAnnexes(authUser.role, route.status);
  const canQuality = canApproveQuality(authUser.role, route.status);
  const canEdit =
    route.status === 'DRAFT' && ['ADMIN', 'ENGINEER'].includes(authUser.role);
  const canAddTask =
    ['ADMIN', 'ENGINEER'].includes(authUser.role) &&
    ['IN_PROGRESS', 'PENDING_ANNEX_REVIEW', 'PENDING_QUALITY_APPROVAL'].includes(
      route.status,
    );
  const canDeliver =
    ['ADMIN', 'SALES'].includes(authUser.role) &&
    route.status === 'COMPLETED' &&
    !route.serviceOrder.deliveredAt;

  const confirmLabels: Record<
    NonNullable<typeof confirmAction>,
    { title: string; description: string; label: string }
  > = {
    approve: {
      title: 'Aprobar hoja de ruta',
      description: `La hoja ${route.code} pasará a ejecución y se desbloqueará la primera etapa.`,
      label: 'Aprobar y liberar',
    },
    annex: {
      title: 'Finalizar anexos',
      description: 'Calidad recibirá la hoja con las evidencias seleccionadas.',
      label: 'Enviar a Calidad',
    },
    quality: {
      title: 'Dar visto bueno de Calidad',
      description: 'La orden de servicio quedará lista para entrega.',
      label: 'Dar visto bueno',
    },
    deliver: {
      title: 'Confirmar entrega',
      description: 'La orden de servicio se marcará como entregada al cliente.',
      label: 'Confirmar entrega',
    },
  };

  const runConfirm = () => {
    if (confirmAction === 'approve') approveMutation.mutate();
    if (confirmAction === 'annex') annexMutation.mutate();
    if (confirmAction === 'quality') qualityMutation.mutate();
    if (confirmAction === 'deliver') deliverMutation.mutate();
  };

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
            eyebrow={`ODS ${route.serviceOrder.orderNumber} · ${route.serviceOrder.clientName}`}
            title={`${route.code} · ${route.serviceOrder.equipmentName}`}
            description={route.serviceOrder.description}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <ApiRouteStatusBadge status={route.status} />
                <PriorityBadge priority={route.serviceOrder.priority} />
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer /> Imprimir
                </Button>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/hojas-de-ruta/nueva?id=${route.id}`)}
                  >
                    <Pencil /> Editar cabezal
                  </Button>
                )}
                {canSend && (
                  <Button
                    size="sm"
                    disabled={submitMutation.isPending}
                    onClick={() => submitMutation.mutate()}
                  >
                    <Send /> Enviar a aprobación
                  </Button>
                )}
                {canApprove && (
                  <>
                    <Button size="sm" onClick={() => setConfirmAction('approve')}>
                      <CheckCircle2 /> Aprobar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRejectKind('route')}
                    >
                      <XCircle /> Rechazar
                    </Button>
                  </>
                )}
                {canQuality && (
                  <>
                    <Button size="sm" onClick={() => setConfirmAction('quality')}>
                      <ShieldCheck /> Dar visto bueno
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRejectKind('quality')}
                    >
                      <XCircle /> Rechazar
                    </Button>
                  </>
                )}
                {canAnnex && (
                  <>
                    <Button size="sm" onClick={() => setConfirmAction('annex')}>
                      <CheckCircle2 /> Finalizar anexos
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRejectKind('annex')}
                    >
                      <XCircle /> Devolver
                    </Button>
                  </>
                )}
                {canDeliver && (
                  <Button size="sm" onClick={() => setConfirmAction('deliver')}>
                    <Package /> Confirmar entrega
                  </Button>
                )}
              </div>
            }
          />
        </div>

        <Card className="border-border/80 bg-card/80 py-0">
          <CardContent className="space-y-4 p-5">
            {route.status !== 'CANCELLED' && (
              <div className="flex flex-wrap items-center gap-2">
                {ROUTE_SHEET_STATUS_ORDER.map((status, index) => {
                  const meta = ROUTE_SHEET_STATUS_META[status];
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
                      <span
                        className={
                          active
                            ? 'text-xs font-semibold text-foreground'
                            : 'text-xs text-muted-foreground'
                        }
                      >
                        {meta.shortLabel}
                      </span>
                      {index < ROUTE_SHEET_STATUS_ORDER.length - 1 && (
                        <span className="mx-1 h-px w-4 bg-border" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-[1fr_280px]">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Cliente:{' '}
                    <strong className="text-foreground">
                      {route.serviceOrder.clientName}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Serial:{' '}
                    <strong className="text-foreground">
                      {route.serviceOrder.equipmentSerial ?? '—'}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Entrega:{' '}
                    <strong className="text-foreground">
                      {route.serviceOrder.dueAt
                        ? formatDate(route.serviceOrder.dueAt)
                        : 'Sin fecha'}
                    </strong>
                  </span>
                </div>
                <ProgressBar
                  value={route.progress}
                  label={`${route.completedTasks} de ${route.totalTasks} tareas completadas`}
                />
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
                <p className="font-medium text-foreground">Etapa actual</p>
                <p className="text-muted-foreground">
                  {route.currentStage ? `Etapa ${route.currentStage}` : 'Sin etapa activa'}
                </p>
                <p className="mt-1 font-medium text-foreground">Proceso activo</p>
                <p className="text-muted-foreground">
                  {route.activeProcess?.name ?? '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="no-print flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
            <TabsTrigger value="resumen">
              <FileText /> Cabezal
            </TabsTrigger>
            <TabsTrigger value="tareas">
              <ClipboardCheck /> Tareas ({route.tasks.length})
            </TabsTrigger>
            <TabsTrigger value="repuestos">
              <Package /> Repuestos
            </TabsTrigger>
            <TabsTrigger value="anexos">
              <ImageIcon /> Anexos ({annexTasks.length})
            </TabsTrigger>
            <TabsTrigger value="calidad">
              <ShieldCheck /> Calidad
            </TabsTrigger>
            <TabsTrigger value="auditoria">
              <History /> Revisiones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard
                title="Datos del servicio"
                description="Información tomada de la orden de servicio."
              >
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">ODS</dt>
                    <dd className="font-mono text-xs">
                      {route.serviceOrder.orderNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Equipo</dt>
                    <dd className="font-medium">{route.serviceOrder.equipmentName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Código del equipo</dt>
                    <dd className="font-mono text-xs">
                      {route.serviceOrder.equipmentCode}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Serial</dt>
                    <dd className="font-mono text-xs">
                      {route.serviceOrder.equipmentSerial ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Sitio / planta</dt>
                    <dd className="font-medium">{route.serviceOrder.siteName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Alcance</dt>
                    <dd className="font-medium">{route.serviceOrder.scope}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Fecha compromiso</dt>
                    <dd className="font-medium">
                      {route.serviceOrder.dueAt
                        ? formatDate(route.serviceOrder.dueAt)
                        : 'Sin fecha'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Entrega</dt>
                    <dd className="font-medium">
                      {route.serviceOrder.deliveredAt
                        ? formatDate(route.serviceOrder.deliveredAt)
                        : 'Pendiente'}
                    </dd>
                  </div>
                </dl>
              </SectionCard>

              <SectionCard
                title="Responsables y firmas"
                description="Trazabilidad de la hoja de ruta."
              >
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Realizado por</dt>
                    <dd className="font-medium">{route.createdBy.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Fecha</dt>
                    <dd className="font-medium">{formatDateTime(route.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Liberada</dt>
                    <dd className="font-medium">
                      {route.releasedAt ? formatDateTime(route.releasedAt) : 'Pendiente'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Completada</dt>
                    <dd className="font-medium">
                      {route.completedAt
                        ? formatDateTime(route.completedAt)
                        : 'Pendiente'}
                    </dd>
                  </div>
                </dl>
                {route.notes && (
                  <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-warning">
                      Observaciones
                    </p>
                    <p className="mt-1 text-foreground">{route.notes}</p>
                  </div>
                )}
              </SectionCard>
            </div>

            <SectionCard
              title="Inspección de origen"
              description="Los primeros pasos de la hoja ya estaban realizados."
            >
              {route.inspection ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {route.inspection.code}
                    </p>
                    <InspectionStatusBadge status={route.inspection.status} />
                  </div>
                  <Button variant="outline" size="sm" asChild className="mt-3">
                    <Link to={`/taller/inspecciones/${route.inspection.id}`}>
                      Ver inspección <ArrowLeft className="rotate-180" />
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Esta hoja no tiene una inspección de origen registrada.
                </p>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="tareas" className="mt-4">
            <SectionCard
              title="Tareas por etapa"
              description="La hoja se ve completa. Solo la tarea de tu puesto y de la etapa activa se puede marcar como lista."
              actions={
                canAddTask ? (
                  <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}>
                    <Plus /> Agregar tarea de corrección
                  </Button>
                ) : undefined
              }
            >
              <ApiTaskList
                tasks={route.tasks}
                canComplete={(task) =>
                  canExecute && canCompleteTask(authUser, task)
                }
                onComplete={(task) => {
                  setCompleteTask(task);
                  setCompleteOpen(true);
                }}
              />
            </SectionCard>
          </TabsContent>

          <TabsContent value="repuestos" className="mt-4">
            <SectionCard
              title="Solicitudes de repuestos"
              description="El módulo de almacén se conectará en la siguiente fase."
            >
              <EmptyState
                icon={Package}
                title="Sin solicitudes conectadas"
                description="Las solicitudes de repuestos siguen en el módulo de almacén pendiente de migración."
              />
            </SectionCard>
          </TabsContent>

          <TabsContent value="anexos" className="mt-4">
            <SectionCard
              title="Anexos y evidencias"
              description="Ingeniería selecciona las fotos que acompañan la hoja. Calidad revisa los anexos seleccionados."
              actions={
                canAnnex ? (
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
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {tasksWithEvidence.map((task) => (
                    <figure
                      key={task.id}
                      className="overflow-hidden rounded-xl border border-border/70 bg-muted/20"
                    >
                      <img
                        src={task.evidenceUrl as string}
                        alt={`Evidencia de ${task.description}`}
                        className="h-36 w-full object-cover"
                      />
                      <figcaption className="space-y-1 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground">
                            Paso {task.sequence ?? '—'}
                          </p>
                          <Badge variant={task.annexSelected ? 'default' : 'outline'}>
                            {task.annexSelected ? 'Incluida' : 'Excluida'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{task.description}</p>
                        {canAnnex && (
                          <label className="mt-2 flex items-center gap-2 text-muted-foreground">
                            <Checkbox
                              checked={Boolean(task.annexSelected)}
                              disabled={toggleAnnexMutation.isPending}
                              onCheckedChange={(value) =>
                                toggleAnnexMutation.mutate({
                                  taskId: task.id,
                                  selected: value === true,
                                })
                              }
                            />
                            Incluir en anexos
                          </label>
                        )}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}

              {route.documents.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-border/70 pt-4">
                  <p className="text-sm font-semibold text-foreground">
                    Documentos de la hoja
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {route.documents.map((document) => (
                      <a
                        key={document.id}
                        href={document.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs transition-colors hover:border-primary/40"
                      >
                        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0">
                          <span className="block font-medium text-foreground">
                            {DOCUMENT_TYPE_LABEL[document.type]}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            {document.uploadedBy.name} ·{' '}
                            {formatDate(document.createdAt)}
                          </span>
                        </span>
                      </a>
                    ))}
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
                canQuality ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setConfirmAction('quality')}>
                      <ShieldCheck /> Dar visto bueno
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRejectKind('quality')}
                    >
                      <XCircle /> Rechazar
                    </Button>
                  </div>
                ) : undefined
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Observaciones
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {route.notes ?? 'Sin observaciones registradas.'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Anexos seleccionados
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {annexTasks.length} evidencia(s) seleccionada(s).
                    </p>
                  </div>
                  {!canQuality && (
                    <p className="text-xs text-muted-foreground">
                      Esta hoja está en estado{' '}
                      <strong>{ROUTE_SHEET_STATUS_META[route.status].label}</strong>. El
                      visto bueno se habilita cuando Ingeniería finaliza los anexos.
                    </p>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {annexTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay evidencias seleccionadas.
                    </p>
                  ) : (
                    annexTasks.map((task) => (
                      <figure
                        key={task.id}
                        className="overflow-hidden rounded-xl border border-border/70"
                      >
                        <img
                          src={task.evidenceUrl as string}
                          alt={`Anexo de ${task.description}`}
                          className="h-32 w-full object-cover"
                        />
                        <figcaption className="p-2 text-[11px] text-muted-foreground">
                          Paso {task.sequence ?? '—'} · {task.description}
                        </figcaption>
                      </figure>
                    ))
                  )}
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="auditoria" className="mt-4">
            <SectionCard
              title="Revisiones de la hoja"
              description="Aprobaciones, devoluciones y visto bueno registrados."
            >
              {route.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin revisiones registradas.
                </p>
              ) : (
                <Timeline
                  items={[...route.reviews]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((review) => ({
                      title: `${REVIEW_STAGE_LABEL[review.stage]} · ${
                        REVIEW_DECISION_LABEL[review.decision]
                      }`,
                      description: `${review.reviewer.name}${
                        review.comments ? `: ${review.comments}` : ''
                      }`,
                      date: formatDateTime(review.createdAt),
                      tone:
                        review.decision === 'APPROVED'
                          ? 'success'
                          : review.decision === 'REJECTED'
                            ? 'danger'
                            : 'warning',
                    }))}
                />
              )}
            </SectionCard>
          </TabsContent>
        </Tabs>

        <ApiCompleteTaskDialog
          open={completeOpen}
          onOpenChange={setCompleteOpen}
          task={completeTask}
          routeSheet={route}
          pending={completeMutation.isPending}
          onSubmit={(payload) => {
            if (!completeTask) return;
            completeMutation.mutate({ taskId: completeTask.id, payload });
          }}
        />

        <AddRouteTaskDialog
          open={taskOpen}
          onOpenChange={setTaskOpen}
          defaultStage={route.currentStage ?? 1}
          pending={addTasksMutation.isPending}
          onSubmit={(tasks) => addTasksMutation.mutate(tasks)}
        />

        <ConfirmDialog
          open={Boolean(confirmAction)}
          onOpenChange={(open) => {
            if (!open) setConfirmAction(null);
          }}
          title={confirmAction ? confirmLabels[confirmAction].title : ''}
          description={confirmAction ? confirmLabels[confirmAction].description : ''}
          confirmLabel={confirmAction ? confirmLabels[confirmAction].label : 'Confirmar'}
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
          title={
            rejectKind === 'quality'
              ? 'Rechazar por Calidad'
              : rejectKind === 'annex'
                ? 'Devolver anexos a ejecución'
                : 'Devolver a Ingeniería'
          }
          description="Escribe el motivo para que el área responsable pueda corregirlo."
          footer={
            <>
              <Button type="button" variant="outline" onClick={() => setRejectKind(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={rejectMutation.isPending}
                onClick={() => {
                  if (!rejectKind) return;
                  if (!rejectReason.trim()) {
                    toast.error('Escribe el motivo del rechazo');
                    return;
                  }
                  rejectMutation.mutate({
                    kind: rejectKind,
                    reason: rejectReason.trim(),
                  });
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
      <RouteSheetPrint route={route} />
    </>
  );
}
