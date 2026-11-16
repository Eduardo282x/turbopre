import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  Image as ImageIcon,
  Layers,
  Package,
  Pencil,
  Play,
  Plus,
  Printer,
  Send,
  ShieldCheck,
  Trash2,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  PartStatusBadge,
  PhaseStatusBadge,
  PriorityBadge,
  RouteStatusBadge,
  SparePartStatusBadge,
} from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { FormDialog } from '@/components/common/form-dialog';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { SectionCard } from '@/components/common/section-card';
import { Timeline } from '@/components/common/timeline';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  AREA_BY_ID,
  AUDIT_ACTION_META,
  PHASE_TYPE_LABELS,
  ROUTE_STATUS_META,
  ROUTE_STATUS_ORDER,
} from '@/features/preview/config';
import {
  getRouteProgress,
  getRouteSheetWithRelations,
  type PhaseWithContext,
} from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type {
  AreaId,
  NewPartInput,
  NewSparePartInput,
  Part,
  Phase,
  SparePart,
} from '@/features/preview/types';
import { formatDate, formatDateTime, formatDurationHours } from '@/lib/formatters';
import {
  canAddInspection,
  canAddPart,
  canApproveQuality,
  canApproveRoute,
  canCompletePhase,
  canDeliverRoute,
  canDispatchSparePart,
  canEditRoute,
  canManageRoutes,
  canRequestSparePart,
  canSendToQuality,
  canSendToReview,
  canStartRoute,
} from '@/lib/permissions';
import { AddInspectionDialog } from './add-inspection-dialog';
import { AddPartDialog } from './add-part-dialog';
import { AddSparePartDialog } from './add-spare-part-dialog';
import { CompletePhaseDialog } from './complete-phase-dialog';
import { RouteSheetFormDialog } from './route-sheet-form-dialog';

export function RouteSheetDetailPage() {
  const { id } = useParams();
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const navigate = useNavigate();

  const [tab, setTab] = useState('resumen');
  const [addPartOpen, setAddPartOpen] = useState(false);
  const [addSpareOpen, setAddSpareOpen] = useState(false);
  const [addInspectionOpen, setAddInspectionOpen] = useState(false);
  const [completeContext, setCompleteContext] = useState<PhaseWithContext | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [editingOpen, setEditingOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePart, setDeletePart] = useState<Part | null>(null);
  const [rejectKind, setRejectKind] = useState<'route' | 'quality' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionConfirm, setActionConfirm] = useState<null | 'approve' | 'start' | 'quality' | 'approve-quality' | 'deliver'>(null);

  const store = usePreviewStore();

  const route = id ? getRouteSheetWithRelations(db, id) : undefined;

  if (!user) return null;

  if (!route) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <EmptyState
          icon={FileText}
          title="Hoja de ruta no encontrada"
          description="El expediente solicitado no existe o fue eliminado."
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
  const currentPhase =
    route.phases.find((phase) => phase.status === 'IN_PROGRESS') ??
    route.phases.find((phase) => phase.status === 'PENDING');
  const currentArea = currentPhase ? AREA_BY_ID[currentPhase.areaId] : undefined;
  const currentResponsible = currentPhase
    ? db.users.find((candidate) => candidate.id === currentPhase.responsibleId)
    : undefined;
  const routeAudit = db.audit.filter(
    (entry) => entry.entityId === route.code || entry.entityId === route.id,
  );

  const partColumns: DataTableColumn<Part>[] = [
    {
      id: 'name',
      header: 'Parte',
      cell: (part) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{part.name}</p>
          <p className="text-xs text-muted-foreground">Cantidad: {part.quantity}</p>
        </div>
      ),
      sortable: true,
      sortValue: (part) => part.name,
    },
    {
      id: 'area',
      header: 'Área actual',
      cell: (part) => <Badge variant="outline">{AREA_BY_ID[part.areaId].shortName}</Badge>,
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (part) => <PartStatusBadge status={part.status} />,
      hideOnMobile: true,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (part) => {
        const progress = getRouteProgress(route.phases.filter((phase) => phase.partId === part.id));
        return <ProgressBar value={progress.progress} className="w-28" />;
      },
    },
  ];

  const phaseColumns: DataTableColumn<Phase>[] = [
    {
      id: 'order',
      header: 'Paso',
      cell: (phase) => <span className="font-mono text-xs text-muted-foreground">{phase.order}</span>,
      sortable: true,
      sortValue: (phase) => phase.order,
    },
    {
      id: 'name',
      header: 'Fase',
      cell: (phase) => {
        const part = route.parts.find((item) => item.id === phase.partId);
        return (
          <div className="min-w-0">
            <p className="font-medium text-foreground">{phase.name}</p>
            <p className="text-xs text-muted-foreground">{part?.name ?? 'Parte'} · {PHASE_TYPE_LABELS[phase.type]}</p>
          </div>
        );
      },
      sortable: true,
      sortValue: (phase) => phase.name,
    },
    {
      id: 'area',
      header: 'Área',
      cell: (phase) => <Badge variant="outline">{AREA_BY_ID[phase.areaId].shortName}</Badge>,
      hideOnMobile: true,
    },
    {
      id: 'responsible',
      header: 'Responsable',
      cell: (phase) => (
        <span className="text-xs">{db.users.find((candidate) => candidate.id === phase.responsibleId)?.name ?? 'Sin asignar'}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (phase) => <PhaseStatusBadge status={phase.status} />,
      sortable: true,
      sortValue: (phase) => phase.status,
    },
    {
      id: 'dates',
      header: 'Fechas',
      cell: (phase) => (
        <div className="text-xs text-muted-foreground">
          <p>{phase.startedAt ? formatDate(phase.startedAt) : 'Sin inicio'}</p>
          <p>{formatDurationHours(phase.startedAt, phase.completedAt)}</p>
        </div>
      ),
      hideOnMobile: true,
    },
  ];

  const spareColumns: DataTableColumn<SparePart>[] = [
    {
      id: 'name',
      header: 'Repuesto',
      cell: (spare) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{spare.name}</p>
          <p className="text-xs text-muted-foreground">{spare.code}</p>
        </div>
      ),
      sortable: true,
      sortValue: (spare) => spare.name,
    },
    {
      id: 'quantity',
      header: 'Cantidad',
      cell: (spare) => <span className="font-mono text-sm">{spare.quantity}</span>,
      hideOnMobile: true,
    },
    {
      id: 'area',
      header: 'Área',
      cell: (spare) => <Badge variant="outline">{AREA_BY_ID[spare.areaId].shortName}</Badge>,
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (spare) => <SparePartStatusBadge status={spare.status} />,
    },
    {
      id: 'date',
      header: 'Solicitado',
      cell: (spare) => <span className="text-xs text-muted-foreground">{formatDate(spare.requestedAt)}</span>,
      hideOnMobile: true,
    },
  ];

  const evidencePhases = route.phases.filter((phase) => phase.evidence);

  const openComplete = (phase: Phase) => {
    const part = route.parts.find((item) => item.id === phase.partId);
    if (!part) return;
    setCompleteContext({
      phase,
      part,
      route,
      component: route.component,
      client: route.client,
      area: AREA_BY_ID[phase.areaId],
    });
    setCompleteOpen(true);
  };

  const confirmAction = () => {
    if (!actionConfirm) return;
    if (actionConfirm === 'approve') {
      store.approveRouteSheet(route.id, user.id);
      toast.success('Hoja de ruta aprobada');
    }
    if (actionConfirm === 'start') {
      store.startRouteSheet(route.id, user.id);
      toast.success('Ejecución iniciada');
    }
    if (actionConfirm === 'quality') {
      store.sendToQuality(route.id, user.id);
      toast.success('Hoja enviada a Calidad');
    }
    if (actionConfirm === 'approve-quality') {
      store.approveQuality(route.id, user.id);
      toast.success('Visto bueno de calidad aprobado');
    }
    if (actionConfirm === 'deliver') {
      store.deliverRouteSheet(route.id, user.id);
      toast.success('Entrega confirmada');
    }
    setActionConfirm(null);
  };

  const confirmLabels: Record<NonNullable<typeof actionConfirm>, { title: string; description: string; label: string }> = {
    approve: {
      title: 'Aprobar hoja de ruta',
      description: `La hoja ${route.code} pasará a estado Aprobada y quedará lista para ejecución.`,
      label: 'Aprobar',
    },
    start: {
      title: 'Iniciar ejecución',
      description: 'La hoja pasará a En ejecución y las áreas podrán completar sus fases.',
      label: 'Iniciar ejecución',
    },
    quality: {
      title: 'Enviar a Calidad',
      description: 'El expediente pasará a revisión final de Calidad.',
      label: 'Enviar a Calidad',
    },
    'approve-quality': {
      title: 'Aprobar calidad',
      description: 'La hoja quedará Lista para entrega y Ventas podrá confirmar el despacho.',
      label: 'Dar visto bueno',
    },
    deliver: {
      title: 'Confirmar entrega',
      description: 'La hoja se marcará como Entregada y se cerrará el compromiso.',
      label: 'Confirmar entrega',
    },
  };

  return (
    <div className="space-y-6">
      <div className="no-print">
        <Button variant="ghost" size="sm" asChild className="mb-3 text-muted-foreground">
          <Link to="/hojas-de-ruta">
            <ArrowLeft /> Volver a hojas de ruta
          </Link>
        </Button>
        <PageHeader
          eyebrow={`${route.component.type} · ${route.component.serial}`}
          title={`${route.code} · ${route.component.name}`}
          description={route.description}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <RouteStatusBadge status={route.status} />
              <PriorityBadge priority={route.priority} />
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer /> Imprimir
              </Button>
              {canEditRoute(user, route) && (
                <Button variant="outline" size="sm" onClick={() => setEditingOpen(true)}>
                  <Pencil /> Editar
                </Button>
              )}
              {canSendToReview(user, route) && (
                <Button
                  size="sm"
                  onClick={() => {
                    if (route.parts.length === 0) {
                      toast.error('Agrega al menos una parte antes de enviar a revisión');
                      return;
                    }
                    store.sendToReview(route.id, user.id);
                    toast.success('Hoja enviada a revisión');
                  }}
                >
                  <Send /> Enviar a revisión
                </Button>
              )}
              {canApproveRoute(user, route) && (
                <>
                  <Button size="sm" onClick={() => setActionConfirm('approve')}>
                    <CheckCircle2 /> Aprobar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setRejectKind('route')}>
                    <XCircle /> Rechazar
                  </Button>
                </>
              )}
              {canStartRoute(user, route) && (
                <Button size="sm" onClick={() => setActionConfirm('start')}>
                  <Play /> Iniciar ejecución
                </Button>
              )}
              {canSendToQuality(user, route) && (
                <Button size="sm" onClick={() => setActionConfirm('quality')}>
                  <ShieldCheck /> Enviar a Calidad
                </Button>
              )}
              {canApproveQuality(user, route) && (
                <>
                  <Button size="sm" onClick={() => setActionConfirm('approve-quality')}>
                    <CheckCircle2 /> Dar visto bueno
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setRejectKind('quality')}>
                    <XCircle /> Rechazar
                  </Button>
                </>
              )}
              {canDeliverRoute(user, route) && (
                <Button size="sm" onClick={() => setActionConfirm('deliver')}>
                  <Package /> Confirmar entrega
                </Button>
              )}
              {canManageRoutes(user) && route.status === 'DRAFT' && (
                <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
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
                <span>Creada por: <strong className="text-foreground">{route.creator.name}</strong></span>
                <span>·</span>
                <span>Entrega: <strong className="text-foreground">{formatDate(route.dueDate)}</strong></span>
              </div>
              <ProgressBar value={route.progress} label={`${route.completedPhases} de ${route.totalPhases} fases completadas`} />
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
              <p className="font-medium text-foreground">Área actual</p>
              <p className="text-muted-foreground">{currentArea?.name ?? 'Sin fase activa'}</p>
              <p className="mt-1 font-medium text-foreground">Responsable</p>
              <p className="text-muted-foreground">{currentResponsible?.name ?? 'Sin asignar'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="no-print flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
          <TabsTrigger value="resumen"><FileText /> Resumen</TabsTrigger>
          <TabsTrigger value="partes"><Layers /> Partes ({route.parts.length})</TabsTrigger>
          <TabsTrigger value="fases"><ClipboardCheck /> Fases ({route.phases.length})</TabsTrigger>
          <TabsTrigger value="repuestos"><Package /> Repuestos ({route.spareParts.length})</TabsTrigger>
          <TabsTrigger value="evidencias"><ImageIcon /> Evidencias ({evidencePhases.length})</TabsTrigger>
          <TabsTrigger value="auditoria"><History /> Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4 space-y-4">
          <SectionCard title="Datos del expediente" description="Información general de la hoja de ruta.">
            <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="text-xs text-muted-foreground">Componente</dt><dd className="font-medium">{route.component.name}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Serial</dt><dd className="font-medium">{route.component.serial}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Cliente</dt><dd className="font-medium">{route.client?.name ?? '—'}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Creada</dt><dd className="font-medium">{formatDateTime(route.createdAt)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Aprobada</dt><dd className="font-medium">{route.approvedAt ? formatDateTime(route.approvedAt) : 'Pendiente'}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Entregada</dt><dd className="font-medium">{route.deliveredAt ? formatDateTime(route.deliveredAt) : 'Pendiente'}</dd></div>
            </dl>
            {route.observations && (
              <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-warning">Observaciones</p>
                <p className="mt-1 text-foreground">{route.observations}</p>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="partes" className="mt-4">
          <SectionCard
            title="Partes del componente"
            description="Cada parte tiene su propia secuencia de fases por área."
            actions={
              canAddPart(user, route) ? (
                <Button size="sm" onClick={() => setAddPartOpen(true)}>
                  <Plus /> Agregar parte
                </Button>
              ) : undefined
            }
            contentClassName="p-0"
          >
            <DataTable
              data={route.parts}
              columns={partColumns}
              getRowId={(part) => part.id}
              search={{ placeholder: 'Buscar parte…', getText: (part) => part.name }}
              actions={[
                {
                  label: 'Ver fases',
                  icon: ClipboardCheck,
                  onSelect: () => setTab('fases'),
                },
                {
                  label: 'Eliminar parte',
                  icon: Trash2,
                  variant: 'destructive',
                  hidden: () => !canAddPart(user, route),
                  onSelect: (part) => setDeletePart(part),
                },
              ]}
              pageSize={10}
              emptyTitle="Sin partes registradas"
              emptyDescription="Agrega la primera parte para comenzar a construir la hoja de ruta."
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="fases" className="mt-4">
          <SectionCard
            title="Fases y ejecución"
            description="Seguimiento por área, responsable y evidencias."
            actions={
              canAddInspection(user, route) ? (
                <Button size="sm" variant="outline" onClick={() => setAddInspectionOpen(true)}>
                  <Wrench /> Agregar inspección
                </Button>
              ) : undefined
            }
            contentClassName="p-0"
          >
            <DataTable
              data={route.phases}
              columns={phaseColumns}
              getRowId={(phase) => phase.id}
              search={{
                placeholder: 'Buscar fase, área o responsable…',
                getText: (phase) =>
                  `${phase.name} ${AREA_BY_ID[phase.areaId].name} ${db.users.find((candidate) => candidate.id === phase.responsibleId)?.name ?? ''}`,
              }}
              actions={[
                {
                  label: 'Completar fase',
                  icon: CheckCircle2,
                  hidden: (phase) =>
                    !canCompletePhase(user, phase) ||
                    phase.status === 'COMPLETED' ||
                    phase.status === 'BLOCKED',
                  onSelect: (phase) => openComplete(phase),
                },
              ]}
              pageSize={10}
              emptyTitle="Sin fases"
              emptyDescription="Agrega partes con secuencia de áreas para generar fases."
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="repuestos" className="mt-4">
          <SectionCard
            title="Repuestos y materiales"
            description="Solicitudes enviadas a Almacén y su estado de despacho."
            actions={
              canRequestSparePart(user, route) ? (
                <Button size="sm" onClick={() => setAddSpareOpen(true)}>
                  <Plus /> Solicitar repuesto
                </Button>
              ) : undefined
            }
            contentClassName="p-0"
          >
            <DataTable
              data={route.spareParts}
              columns={spareColumns}
              getRowId={(spare) => spare.id}
              search={{ placeholder: 'Buscar repuesto o código…', getText: (spare) => `${spare.name} ${spare.code}` }}
              actions={[
                {
                  label: 'Despachar',
                  icon: Package,
                  hidden: (spare) => !canDispatchSparePart(user) || spare.status === 'DISPATCHED',
                  onSelect: (spare) => {
                    store.updateSparePartStatus(spare.id, 'DISPATCHED', user.id);
                    toast.success(`${spare.name} despachado`);
                  },
                },
                {
                  label: 'Aprobar',
                  icon: CheckCircle2,
                  hidden: (spare) => !canDispatchSparePart(user) || spare.status !== 'PENDING',
                  onSelect: (spare) => {
                    store.updateSparePartStatus(spare.id, 'APPROVED', user.id);
                    toast.success(`${spare.name} aprobado`);
                  },
                },
              ]}
              pageSize={10}
              emptyTitle="Sin repuestos solicitados"
              emptyDescription="Solicita materiales a Almacén cuando la ejecución lo requiera."
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="evidencias" className="mt-4">
          <SectionCard title="Evidencias del trabajo" description="Registros fotográficos y observaciones de las fases completadas.">
            {evidencePhases.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="Sin evidencias todavía"
                description="Las fotos cargadas al completar fases aparecerán aquí."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {evidencePhases.map((phase) => {
                  const part = route.parts.find((item) => item.id === phase.partId);
                  return (
                    <figure key={phase.id} className="overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                      <img src={phase.evidence} alt={`Evidencia de ${phase.name}`} className="h-40 w-full object-cover" />
                      <figcaption className="space-y-1 p-3 text-xs">
                        <p className="font-medium text-foreground">{phase.name}</p>
                        <p className="text-muted-foreground">{part?.name} · {AREA_BY_ID[phase.areaId].shortName}</p>
                        <p className="text-muted-foreground">{phase.completedAt ? formatDateTime(phase.completedAt) : ''}</p>
                        {phase.observations && <p className="text-foreground">{phase.observations}</p>}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="auditoria" className="mt-4">
          <SectionCard title="Auditoría del expediente" description="Eventos registrados para esta hoja de ruta.">
            {routeAudit.length === 0 ? (
              <EmptyState icon={History} title="Sin eventos" description="No hay movimientos registrados para este expediente." />
            ) : (
              <Timeline
                items={routeAudit.map((entry) => ({
                  title: `${AUDIT_ACTION_META[entry.action].label} · ${entry.entity}`,
                  description: `${entry.userName}: ${entry.detail}`,
                  date: formatDateTime(entry.createdAt),
                  tone:
                    entry.action === 'DELETE' || entry.action === 'REJECT'
                      ? 'danger'
                      : entry.action === 'APPROVE' || entry.action === 'COMPLETE' || entry.action === 'DELIVER'
                        ? 'success'
                        : entry.action === 'UPDATE'
                          ? 'warning'
                          : 'info',
                }))}
              />
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      <AddPartDialog
        open={addPartOpen}
        onOpenChange={setAddPartOpen}
        onSubmit={(input: NewPartInput) => {
          store.addPart(route.id, input, user.id);
          toast.success('Parte agregada con sus fases');
        }}
      />
      <AddSparePartDialog
        open={addSpareOpen}
        onOpenChange={setAddSpareOpen}
        parts={route.parts}
        onSubmit={(input: NewSparePartInput) => {
          store.addSparePart(route.id, input, user.id);
          toast.success('Solicitud de repuesto enviada');
        }}
      />
      <AddInspectionDialog
        open={addInspectionOpen}
        onOpenChange={setAddInspectionOpen}
        parts={route.parts}
        onSubmit={(input) => {
          store.addInspectionPhase(route.id, input.partId, input.areaId as AreaId, user.id, input.description);
          toast.success('Inspección agregada');
        }}
      />
      <CompletePhaseDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        context={completeContext}
        onSubmit={(payload) => {
          if (!completeContext) return;
          store.completePhase(completeContext.phase.id, user.id, payload);
          toast.success('Fase completada con evidencia');
        }}
      />
      <RouteSheetFormDialog
        key={`edit-${editingOpen}`}
        open={editingOpen}
        onOpenChange={setEditingOpen}
        route={route}
        onSubmit={(input) => {
          store.updateRouteSheet(route.id, input, user.id);
          toast.success('Hoja de ruta actualizada');
        }}
      />
      <ConfirmDialog
        open={Boolean(actionConfirm)}
        onOpenChange={(open) => {
          if (!open) setActionConfirm(null);
        }}
        title={actionConfirm ? confirmLabels[actionConfirm].title : ''}
        description={actionConfirm ? confirmLabels[actionConfirm].description : ''}
        confirmLabel={actionConfirm ? confirmLabels[actionConfirm].label : 'Confirmar'}
        onConfirm={confirmAction}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar hoja de ruta"
        description={`Se eliminarán la hoja ${route.code}, sus partes, fases y repuestos. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={() => {
          store.deleteRouteSheet(route.id, user.id);
          toast.info('Hoja de ruta eliminada');
          navigate('/hojas-de-ruta', { replace: true });
        }}
      />
      <ConfirmDialog
        open={Boolean(deletePart)}
        onOpenChange={(open) => {
          if (!open) setDeletePart(null);
        }}
        title="Eliminar parte"
        description={`Se eliminarán la parte ${deletePart?.name ?? ''} y todas sus fases.`}
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={() => {
          if (!deletePart) return;
          store.deletePart(route.id, deletePart.id, user.id);
          toast.info('Parte eliminada');
          setDeletePart(null);
        }}
      />

      <FormDialog
        open={Boolean(rejectKind)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectKind(null);
            setRejectReason('');
          }
        }}
        title={rejectKind === 'quality' ? 'Rechazar por calidad' : 'Devolver a borrador'}
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
                  store.rejectQuality(route.id, user.id, rejectReason.trim());
                } else if (rejectKind === 'route') {
                  store.rejectRouteSheet(route.id, user.id, rejectReason.trim());
                }
                toast.info('Expediente devuelto con observaciones');
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
          placeholder="Ej: Faltan mediciones del área de mecanizado."
        />
      </FormDialog>
    </div>
  );
}
