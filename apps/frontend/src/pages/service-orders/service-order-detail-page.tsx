import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Factory,
  FileText,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Truck,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  InspectionStatusBadge,
  PriorityBadge,
  RouteStatusBadge,
  ServiceOrderStatusBadge,
} from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { SectionCard } from '@/components/common/section-card';
import { Timeline } from '@/components/common/timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AUDIT_ACTION_META } from '@/features/preview/config';
import {
  getInspectionWithRelations,
  getRouteSheetWithRelations,
  getServiceOrderStatus,
} from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { useServiceOrder } from '@/hooks/use-commercial-data';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { canCreateInspection, canManageRoutes, canManageServiceOrders } from '@/lib/permissions';
import type { CreateServiceOrderInput, ServiceOrderWorkflowStatus } from '@turbopre/shared';
import { serviceOrdersService } from '@/services/service-orders/service-orders.service';
import { ServiceOrderFormDialog } from './service-order-form-dialog';

const FLOW: Array<{
  statuses: ServiceOrderWorkflowStatus[];
  label: string;
  icon: typeof ClipboardList;
}> = [
  { statuses: ['RECEIVED'], label: 'ODS recibida', icon: ClipboardList },
  { statuses: ['IN_INSPECTION'], label: 'Inspección', icon: ClipboardCheck },
  { statuses: ['INSPECTION_APPROVED', 'IN_ROUTE'], label: 'Hoja de ruta', icon: FileText },
  { statuses: ['IN_EXECUTION'], label: 'Ejecución', icon: Factory },
  { statuses: ['IN_ANNEXES'], label: 'Anexos', icon: FileText },
  { statuses: ['IN_QUALITY'], label: 'Calidad', icon: ShieldCheck },
  { statuses: ['READY_FOR_DELIVERY', 'DELIVERED'], label: 'Entrega', icon: Truck },
];

export function ServiceOrderDetailPage() {
  const { id } = useParams();
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const orderQuery = useServiceOrder(id);
  const db = usePreviewStore((state) => state.db);
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    if (id) {
      void queryClient.invalidateQueries({ queryKey: ['service-orders', 'detail', id] });
    }
    void queryClient.invalidateQueries({ queryKey: ['clients'] });
    void queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const updateMutation = useMutation({
    mutationFn: (input: CreateServiceOrderInput) =>
      serviceOrdersService.update(id as string, input),
    onSuccess: (order) => {
      invalidate();
      toast.success('Orden de servicio actualizada', { description: order.orderNumber });
      setEditOpen(false);
    },
    onError: (error) =>
      toast.error('No se pudo actualizar la ODS', {
        description: getApiErrorMessage(error),
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => serviceOrdersService.cancel(id as string),
    onSuccess: (order) => {
      invalidate();
      toast.info('Orden de servicio cancelada', { description: order.orderNumber });
      setCancelOpen(false);
    },
    onError: (error) =>
      toast.error('No se pudo cancelar la ODS', {
        description: getApiErrorMessage(error),
      }),
  });

  const deliverMutation = useMutation({
    mutationFn: () => serviceOrdersService.deliver(id as string),
    onSuccess: (order) => {
      invalidate();
      toast.success('Entrega registrada', { description: order.orderNumber });
      setDeliverOpen(false);
    },
    onError: (error) =>
      toast.error('No se pudo registrar la entrega', {
        description: getApiErrorMessage(error),
      }),
  });

  if (!user) return null;

  if (orderQuery.isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Cargando orden de servicio…
      </div>
    );
  }

  const order = orderQuery.data;

  if (!order) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <EmptyState
          icon={ClipboardList}
          title="Orden de servicio no encontrada"
          description="La ODS solicitada no existe o fue cancelada."
          action={
            <Button asChild variant="outline">
              <Link to="/ordenes-servicio">
                <ArrowLeft /> Volver al listado
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const previewOrder = db.serviceOrders.find((item) => item.id === order.id);
  const inspection = previewOrder?.inspectionId
    ? getInspectionWithRelations(db, previewOrder.inspectionId)
    : undefined;
  const routeSheet = previewOrder?.routeSheetId
    ? getRouteSheetWithRelations(db, previewOrder.routeSheetId)
    : undefined;
  const inspectionId = order.inspectionId ?? previewOrder?.inspectionId;
  const routeSheetId = order.routeSheetId ?? previewOrder?.routeSheetId;
  const apiStatusWins = ['READY_FOR_DELIVERY', 'DELIVERED', 'CLOSED', 'CANCELLED'].includes(
    order.status,
  );
  const displayStatus = apiStatusWins
    ? order.workflowStatus
    : previewOrder
      ? getServiceOrderStatus(db, previewOrder)
      : order.workflowStatus;
  const displayProgress = routeSheet?.progress ?? inspection?.progress ?? order.progress;

  const currentFlowIndex = Math.max(
    0,
    FLOW.findIndex((step) => step.statuses.includes(displayStatus)),
  );

  const orderAudit = db.audit
    .filter((entry) =>
      [
        order.orderNumber,
        order.id,
        previewOrder?.code,
        previewOrder?.subCode,
        inspection?.code,
        routeSheet?.code,
      ]
        .filter(Boolean)
        .includes(entry.entityId),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const canEdit =
    canManageServiceOrders(user) &&
    (user.role === 'ADMIN' || (!inspectionId && !routeSheetId));
  const canCancel =
    canManageServiceOrders(user) &&
    !['DELIVERED', 'CANCELLED'].includes(order.status);
  const canDeliver =
    canManageServiceOrders(user) && order.status === 'READY_FOR_DELIVERY';

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 text-muted-foreground">
          <Link to="/ordenes-servicio">
            <ArrowLeft /> Volver a órdenes de servicio
          </Link>
        </Button>
        <PageHeader
          eyebrow={`${order.client.name} · ${order.equipment.manufacturer ?? ''} ${order.equipment.model ?? ''}`}
          title={order.orderNumber}
          description={order.description}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <ServiceOrderStatusBadge status={displayStatus} />
              <PriorityBadge priority={order.priority} />
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil /> Editar
                </Button>
              )}
              {canDeliver && (
                <Button size="sm" onClick={() => setDeliverOpen(true)}>
                  <Truck /> Confirmar entrega
                </Button>
              )}
              {canCancel && (
                <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>
                  Cancelar ODS
                </Button>
              )}
              {canCreateInspection(user) && !inspectionId && previewOrder && (
                <Button size="sm" onClick={() => navigate(`/taller/inspecciones?ods=${order.id}`)}>
                  <Plus /> Crear inspección
                </Button>
              )}
              {inspectionId && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/taller/inspecciones/${inspectionId}`}>
                    <ClipboardCheck /> Ver inspección
                  </Link>
                </Button>
              )}
              {routeSheetId && (
                <Button size="sm" asChild>
                  <Link to={`/hojas-de-ruta/${routeSheetId}`}>
                    <FileText /> Ver hoja de ruta
                  </Link>
                </Button>
              )}
            </div>
          }
        />
      </div>

      <Card className="border-border/80 bg-card/80 py-0">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {FLOW.map((step, index) => {
              const Icon = step.icon;
              const done = index < currentFlowIndex;
              const active = index === currentFlowIndex;
              return (
                <div key={step.label} className="flex items-center gap-2">
                  <span
                    className={`flex size-7 items-center justify-center rounded-full ${
                      done
                        ? 'bg-success/15 text-success'
                        : active
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span
                    className={
                      active
                        ? 'text-xs font-semibold text-foreground'
                        : 'text-xs text-muted-foreground'
                    }
                  >
                    {step.label}
                  </span>
                  {index < FLOW.length - 1 && (
                    <ArrowRight className="size-3 text-muted-foreground/50" />
                  )}
                </div>
              );
            })}
          </div>
          <ProgressBar value={displayProgress} label={`Avance de la ODS: ${displayProgress}%`} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Datos de la orden"
          description="Información que Ventas entregó a Taller e Ingeniería."
        >
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Cliente / empresa</dt>
              <dd className="font-medium">{order.client.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Equipo</dt>
              <dd className="font-medium">{order.equipment.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Código del equipo</dt>
              <dd className="font-mono text-xs">{order.equipment.code}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Serial</dt>
              <dd className="font-mono text-xs">{order.equipment.serialNumber ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Sitio / planta</dt>
              <dd className="flex items-center gap-1 font-medium">
                <MapPin className="size-3.5 text-muted-foreground" /> {order.site.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha compromiso</dt>
              <dd className="flex items-center gap-1 font-medium">
                <CalendarDays className="size-3.5 text-muted-foreground" />{' '}
                {order.dueAt ? formatDate(order.dueAt) : 'Sin fecha'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Creada por</dt>
              <dd className="flex items-center gap-1 font-medium">
                <User className="size-3.5 text-muted-foreground" /> {order.createdBy.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha de creación</dt>
              <dd className="font-medium">{formatDateTime(order.requestedAt)}</dd>
            </div>
            {order.project && (
              <div>
                <dt className="text-xs text-muted-foreground">Proyecto</dt>
                <dd className="font-medium">
                  {order.project.code} · {order.project.name}
                </dd>
              </div>
            )}
            {order.parentOrderNumber && (
              <div>
                <dt className="text-xs text-muted-foreground">ODS principal</dt>
                <dd className="font-medium">{order.parentOrderNumber}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Alcance
              </p>
              <p className="mt-1 text-sm text-foreground">{order.scope}</p>
            </div>
            {order.notes && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-warning">
                  Observaciones
                </p>
                <p className="mt-1 text-sm text-foreground">{order.notes}</p>
              </div>
            )}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard
            title="Inspección"
            description="Taller evalúa el equipo y define las tareas de inspección."
          >
            {inspection ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{inspection.code}</p>
                  <InspectionStatusBadge status={inspection.status} />
                </div>
                <ProgressBar
                  value={inspection.progress}
                  label={`${inspection.completedTasks} de ${inspection.totalTasks} tareas`}
                />
                <p className="text-xs text-muted-foreground">
                  {inspection.findings ?? 'Sin hallazgos registrados.'}
                </p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/taller/inspecciones/${inspection.id}`}>
                    Ver inspección <ArrowRight />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Todavía no hay inspección asociada.</p>
                {previewOrder ? (
                  canCreateInspection(user) && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/taller/inspecciones?ods=${order.id}`)}
                    >
                      <Plus /> Crear inspección
                    </Button>
                  )
                ) : (
                  <p className="text-[11px]">
                    La creación de inspecciones se conectará en la siguiente fase.
                  </p>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Hoja de ruta"
            description="Ingeniería la crea a partir de la inspección aprobada."
          >
            {routeSheet ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{routeSheet.code}</p>
                  <RouteStatusBadge status={routeSheet.status} />
                </div>
                <ProgressBar
                  value={routeSheet.progress}
                  label={`${routeSheet.completedTasks} de ${routeSheet.totalTasks} tareas`}
                />
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/hojas-de-ruta/${routeSheet.id}`}>
                    Ver hoja de ruta <ArrowRight />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {inspection?.status === 'APPROVED'
                    ? 'La inspección está aprobada y espera la hoja de ruta de Ingeniería.'
                    : 'La hoja de ruta se habilita cuando Taller aprueba la inspección.'}
                </p>
                {inspection?.status === 'APPROVED' && canManageRoutes(user) && (
                  <Button size="sm" asChild>
                    <Link to={`/hojas-de-ruta/nueva?inspeccion=${inspection.id}`}>
                      <Plus /> Crear hoja de ruta
                    </Link>
                  </Button>
                )}
                {!previewOrder && (
                  <p className="text-[11px]">
                    La creación de hojas de ruta se conectará en una fase posterior.
                  </p>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Historial de la orden"
        description="Eventos registrados para la ODS, la inspección y la hoja de ruta."
      >
        {orderAudit.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin eventos registrados todavía.</p>
        ) : (
          <Timeline
            items={orderAudit.map((entry) => ({
              title: `${AUDIT_ACTION_META[entry.action].label} · ${entry.entity}`,
              description: `${entry.userName}: ${entry.detail}`,
              date: formatDateTime(entry.createdAt),
              tone:
                entry.action === 'REJECT' || entry.action === 'DELETE'
                  ? 'danger'
                  : entry.action === 'APPROVE' ||
                      entry.action === 'COMPLETE' ||
                      entry.action === 'DELIVER'
                    ? 'success'
                    : 'info',
            }))}
          />
        )}
      </SectionCard>

      <ServiceOrderFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        order={order}
        pending={updateMutation.isPending}
        onSubmit={(input) => updateMutation.mutate(input)}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar orden de servicio"
        description={`¿Seguro que deseas cancelar la ODS ${order.orderNumber}? La inspección y la hoja de ruta, si existen, conservarán su historial.`}
        confirmLabel="Sí, cancelar"
        destructive
        onConfirm={() => cancelMutation.mutate()}
      />

      <ConfirmDialog
        open={deliverOpen}
        onOpenChange={setDeliverOpen}
        title="Confirmar entrega"
        description={`Se registrará la entrega de la ODS ${order.orderNumber} al cliente.`}
        confirmLabel="Confirmar entrega"
        onConfirm={() => deliverMutation.mutate()}
      />
    </div>
  );
}
