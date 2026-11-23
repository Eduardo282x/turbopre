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
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { SectionCard } from '@/components/common/section-card';
import { Timeline } from '@/components/common/timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AUDIT_ACTION_META } from '@/features/preview/config';
import { getServiceOrderWithRelations } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { NewServiceOrderInput, ServiceOrderStatus } from '@/features/preview/types';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { canCreateInspection, canManageRoutes, canManageServiceOrders } from '@/lib/permissions';
import { ServiceOrderFormDialog } from './service-order-form-dialog';

const FLOW: Array<{ statuses: ServiceOrderStatus[]; label: string; icon: typeof ClipboardList }> = [
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
  const db = usePreviewStore((state) => state.db);
  const updateServiceOrder = usePreviewStore((state) => state.updateServiceOrder);
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  if (!user) return null;

  const order = id ? getServiceOrderWithRelations(db, id) : undefined;

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

  const currentFlowIndex = Math.max(
    0,
    FLOW.findIndex((step) => step.statuses.includes(order.status)),
  );

  const orderAudit = db.audit
    .filter(
      (entry) =>
        [order.code, order.subCode, order.id, order.inspection?.code, order.routeSheet?.code]
          .filter(Boolean)
          .includes(entry.entityId),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const canEdit =
    canManageServiceOrders(user) &&
    (user.role === 'ADMIN' || (!order.inspectionId && !order.routeSheetId));

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 text-muted-foreground">
          <Link to="/ordenes-servicio">
            <ArrowLeft /> Volver a órdenes de servicio
          </Link>
        </Button>
        <PageHeader
          eyebrow={`${order.client?.name ?? 'Sin cliente'} · ${order.asset?.manufacturer} ${order.asset?.model}`}
          title={`${order.code} · ${order.subCode}`}
          description={order.description}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <ServiceOrderStatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil /> Editar
                </Button>
              )}
              {canCreateInspection(user) && !order.inspectionId && (
                <Button size="sm" onClick={() => navigate(`/taller/inspecciones?ods=${order.id}`)}>
                  <Plus /> Crear inspección
                </Button>
              )}
              {order.inspectionId && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/taller/inspecciones/${order.inspectionId}`}>
                    <ClipboardCheck /> Ver inspección
                  </Link>
                </Button>
              )}
              {order.routeSheetId && (
                <Button size="sm" asChild>
                  <Link to={`/hojas-de-ruta/${order.routeSheetId}`}>
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
                  <span className={active ? 'text-xs font-semibold text-foreground' : 'text-xs text-muted-foreground'}>
                    {step.label}
                  </span>
                  {index < FLOW.length - 1 && <ArrowRight className="size-3 text-muted-foreground/50" />}
                </div>
              );
            })}
          </div>
          <ProgressBar value={order.progress} label={`Avance de la ODS: ${order.progress}%`} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Datos de la orden" description="Información que Ventas entregó a Taller e Ingeniería.">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Cliente / empresa</dt>
              <dd className="font-medium">{order.client?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Equipo</dt>
              <dd className="font-medium">
                {order.asset?.manufacturer} {order.asset?.model}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Código del equipo</dt>
              <dd className="font-mono text-xs">{order.equipmentCode}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Serial</dt>
              <dd className="font-mono text-xs">{order.asset?.serial ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Sitio / planta</dt>
              <dd className="flex items-center gap-1 font-medium">
                <MapPin className="size-3.5 text-muted-foreground" /> {order.site}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha compromiso</dt>
              <dd className="flex items-center gap-1 font-medium">
                <CalendarDays className="size-3.5 text-muted-foreground" /> {formatDate(order.dueDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Creada por</dt>
              <dd className="flex items-center gap-1 font-medium">
                <User className="size-3.5 text-muted-foreground" /> {order.creator.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha de creación</dt>
              <dd className="font-medium">{formatDateTime(order.createdAt)}</dd>
            </div>
          </dl>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alcance</p>
              <p className="mt-1 text-sm text-foreground">{order.scope}</p>
            </div>
            {order.observations && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-warning">Observaciones</p>
                <p className="mt-1 text-sm text-foreground">{order.observations}</p>
              </div>
            )}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Inspección" description="Taller evalúa el equipo y define las tareas de inspección.">
            {order.inspection ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{order.inspection.code}</p>
                  <InspectionStatusBadge status={order.inspection.status} />
                </div>
                <ProgressBar
                  value={order.inspection.progress}
                  label={`${order.inspection.completedTasks} de ${order.inspection.totalTasks} tareas`}
                />
                <p className="text-xs text-muted-foreground">{order.inspection.findings ?? 'Sin hallazgos registrados.'}</p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/taller/inspecciones/${order.inspection.id}`}>
                    Ver inspección <ArrowRight />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Todavía no hay inspección asociada.</p>
                {canCreateInspection(user) && (
                  <Button size="sm" onClick={() => navigate(`/taller/inspecciones?ods=${order.id}`)}>
                    <Plus /> Crear inspección
                  </Button>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Hoja de ruta" description="Ingeniería la crea a partir de la inspección aprobada.">
            {order.routeSheet ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{order.routeSheet.code}</p>
                  <RouteStatusBadge status={order.routeSheet.status} />
                </div>
                <ProgressBar
                  value={order.routeSheet.progress}
                  label={`${order.routeSheet.completedTasks} de ${order.routeSheet.totalTasks} tareas`}
                />
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/hojas-de-ruta/${order.routeSheet.id}`}>
                    Ver hoja de ruta <ArrowRight />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {order.inspection?.status === 'APPROVED'
                    ? 'La inspección está aprobada y espera la hoja de ruta de Ingeniería.'
                    : 'La hoja de ruta se habilita cuando Taller aprueba la inspección.'}
                </p>
                {order.inspection?.status === 'APPROVED' && canManageRoutes(user) && (
                  <Button size="sm" asChild>
                    <Link to={`/hojas-de-ruta/nueva?inspeccion=${order.inspection.id}`}>
                      <Plus /> Crear hoja de ruta
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Historial de la orden" description="Eventos registrados para la ODS, la inspección y la hoja de ruta.">
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
                  : entry.action === 'APPROVE' || entry.action === 'COMPLETE' || entry.action === 'DELIVER'
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
        onSubmit={(input: NewServiceOrderInput) => {
          updateServiceOrder(order.id, input, user.id);
          toast.success('Orden de servicio actualizada');
        }}
      />
    </div>
  );
}
