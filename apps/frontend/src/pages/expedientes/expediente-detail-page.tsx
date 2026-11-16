import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Gauge,
  Route,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  FieldStatusBadge,
  NonConformitySeverityBadge,
  NonConformityStatusBadge,
  PriorityBadge,
  ProjectPhaseBadge,
  QualityRecordTypeBadge,
  QualityResultBadge,
  ServiceModeBadge,
  ServiceOrderStatusBadge,
  SupplyStatusBadge,
} from '@/components/common/badges';
import { EmptyState } from '@/components/common/empty-state';
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
import {
  ASSET_TYPE_META,
  AUDIT_ACTION_META,
  FIELD_STATUS_META,
  PROJECT_PHASE_META,
  SERVICE_MODE_META,
  SERVICE_ORDER_STATUS_META,
  SERVICE_SCOPE_META,
  SUPPLY_STATUS_META,
} from '@/features/preview/config';
import {
  getServiceOrderWithRelations,
} from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type {
  NonConformity,
  ProjectPhase,
  QualityRecord,
  ServiceOrderStatus,
  SupplyStatus,
} from '@/features/preview/types';
import { formatDate, formatDateTime } from '@/lib/formatters';
import {
  canManageField,
  canManageNonConformities,
  canManageProjects,
  canManageQuality,
  canManageServiceOrder,
  canManageSupply,
} from '@/lib/permissions';

const NEXT_STATUS: Record<ServiceOrderStatus, ServiceOrderStatus | null> = {
  RECEIVED: 'DIAGNOSIS',
  DIAGNOSIS: 'SCOPING',
  SCOPING: 'PLANNING',
  PLANNING: 'APPROVED',
  APPROVED: 'IN_EXECUTION',
  IN_EXECUTION: 'IN_QUALITY',
  IN_QUALITY: 'READY_FOR_DELIVERY',
  READY_FOR_DELIVERY: 'DELIVERED',
  DELIVERED: 'CLOSED',
  CLOSED: null,
  CANCELLED: null,
};

const PROJECT_PHASE_ORDER: ProjectPhase[] = [
  'ENGINEERING',
  'PROCUREMENT',
  'CONSTRUCTION',
  'PRECOMMISSIONING',
  'COMMISSIONING',
  'CLOSED',
];

const SUPPLY_ORDER: SupplyStatus[] = [
  'REQUESTED',
  'QUOTED',
  'PURCHASED',
  'INSPECTION',
  'DISPATCHED',
  'DELIVERED',
];

export function ExpedienteDetailPage() {
  const { id } = useParams();
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const store = usePreviewStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('resumen');

  const order = id ? getServiceOrderWithRelations(db, id) : undefined;

  if (!user) return null;

  if (!order) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <EmptyState
          icon={ShieldAlert}
          title="Expediente no encontrado"
          description="El expediente solicitado no existe o fue eliminado."
          action={
            <Button asChild variant="outline">
              <Link to="/expedientes">
                <ArrowLeft /> Volver a expedientes
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const nextStatus = NEXT_STATUS[order.status];
  const orderAudit = db.audit.filter(
    (entry) => entry.entityId === order.code || entry.entityId === order.id,
  );

  const qualityColumns: DataTableColumn<QualityRecord>[] = [
    {
      id: 'type',
      header: 'Tipo',
      cell: (record) => (
        <div className="space-y-1">
          <QualityRecordTypeBadge type={record.type} />
          <p className="text-xs text-muted-foreground">{record.method}</p>
        </div>
      ),
      sortable: true,
      sortValue: (record) => record.type,
    },
    {
      id: 'standard',
      header: 'Norma / criterio',
      cell: (record) => (
        <div className="max-w-64 text-xs">
          <p className="text-foreground">{record.standard}</p>
          <p className="text-muted-foreground">{record.acceptanceCriteria}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'result',
      header: 'Resultado',
      cell: (record) => <QualityResultBadge result={record.result} />,
      sortable: true,
      sortValue: (record) => record.result,
    },
    {
      id: 'inspector',
      header: 'Inspector',
      cell: (record) => (
        <span className="text-xs">{db.users.find((candidate) => candidate.id === record.inspectorId)?.name ?? '—'}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'date',
      header: 'Fecha',
      cell: (record) => (
        <span className="text-xs text-muted-foreground">
          {record.testedAt ? formatDate(record.testedAt) : 'Pendiente'}
        </span>
      ),
      hideOnMobile: true,
    },
  ];

  const ncColumns: DataTableColumn<NonConformity>[] = [
    {
      id: 'description',
      header: 'No conformidad',
      cell: (record) => <span className="block max-w-80 text-sm text-foreground">{record.description}</span>,
    },
    {
      id: 'severity',
      header: 'Severidad',
      cell: (record) => <NonConformitySeverityBadge severity={record.severity} />,
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (record) => <NonConformityStatusBadge status={record.status} />,
    },
    {
      id: 'responsible',
      header: 'Responsable',
      cell: (record) => (
        <span className="text-xs">{db.users.find((candidate) => candidate.id === record.responsibleId)?.name ?? '—'}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'date',
      header: 'Fecha',
      cell: (record) => <span className="text-xs text-muted-foreground">{formatDate(record.createdAt)}</span>,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 text-muted-foreground">
          <Link to="/expedientes">
            <ArrowLeft /> Volver a expedientes
          </Link>
        </Button>
        <PageHeader
          eyebrow={`${SERVICE_MODE_META[order.mode].label} · ${SERVICE_SCOPE_META[order.scope].label}`}
          title={`${order.code} · ${order.asset?.manufacturer ?? ''} ${order.asset?.model ?? ''}`}
          description={order.description}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <ServiceModeBadge mode={order.mode} />
              <ServiceOrderStatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
              {nextStatus && canManageServiceOrder(user) && (
                <Button
                  size="sm"
                  onClick={() => {
                    store.updateServiceOrderStatus(order.id, nextStatus, user.id);
                    toast.success(`Expediente actualizado a ${SERVICE_ORDER_STATUS_META[nextStatus].label}`);
                  }}
                >
                  <ChevronRight /> Avanzar a {SERVICE_ORDER_STATUS_META[nextStatus].shortLabel}
                </Button>
              )}
              {!order.routeSheetId && canManageServiceOrder(user) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const template = db.serviceTemplates.find((item) => item.scope === order.scope) ?? db.serviceTemplates[0];
                    if (!template) {
                      toast.error('No hay plantillas disponibles');
                      return;
                    }
                    const routeSheetId = store.createRouteSheetFromTemplate(order.id, template.id, user.id);
                    if (routeSheetId) {
                      toast.success('Hoja de ruta generada');
                      navigate(`/hojas-de-ruta/${routeSheetId}`);
                    }
                  }}
                >
                  <Route /> Generar hoja de ruta
                </Button>
              )}
              {order.routeSheet && (
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/hojas-de-ruta/${order.routeSheet.id}`}>
                    <ExternalLink /> Abrir hoja de ruta
                  </Link>
                </Button>
              )}
            </div>
          }
        />
      </div>

      <Card className="border-border/80 bg-card/80 py-0">
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Cliente: <strong className="text-foreground">{order.client?.name ?? '—'}</strong></span>
              <span>·</span>
              <span>Activo: <strong className="text-foreground">{order.asset?.manufacturer} {order.asset?.model} ({order.asset?.tag})</strong></span>
              <span>·</span>
              <span>Sitio: <strong className="text-foreground">{order.site}</strong></span>
            </div>
            <ProgressBar value={order.progress} label={`${order.progress}% de avance`} />
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{order.qualityRecords.filter((record) => record.result === 'PASS').length} pruebas aprobadas</Badge>
              <Badge variant="outline">{order.qualityRecords.filter((record) => record.result === 'PENDING').length} pruebas pendientes</Badge>
              <Badge variant="outline" className={order.openNonConformities > 0 ? 'text-destructive' : undefined}>
                {order.openNonConformities} NC abiertas
              </Badge>
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
            <p className="font-medium text-foreground">Responsable</p>
            <p className="text-muted-foreground">{order.creator.name}</p>
            <p className="mt-2 font-medium text-foreground">Fecha compromiso</p>
            <p className="text-muted-foreground">{formatDate(order.dueDate)}</p>
            <p className="mt-2 font-medium text-foreground">Aprobación</p>
            <p className="text-muted-foreground">{order.approvedAt ? formatDateTime(order.approvedAt) : 'Pendiente'}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="activo">Activo</TabsTrigger>
          <TabsTrigger value="ruta">Hoja de ruta</TabsTrigger>
          <TabsTrigger value="calidad">Calidad / NDT</TabsTrigger>
          <TabsTrigger value="nc">No conformidades</TabsTrigger>
          {(order.fieldJob || order.project || order.supplyOrder) && (
            <TabsTrigger value="operacion">
              {order.fieldJob ? 'Campo' : order.project ? 'Proyecto' : 'Suministro'}
            </TabsTrigger>
          )}
          <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4">
          <SectionCard title="Datos del expediente" description="Información comercial y técnica.">
            <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="text-xs text-muted-foreground">Modo</dt><dd className="font-medium">{SERVICE_MODE_META[order.mode].label}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Alcance</dt><dd className="font-medium">{SERVICE_SCOPE_META[order.scope].label}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Prioridad</dt><dd><PriorityBadge priority={order.priority} /></dd></div>
              <div><dt className="text-xs text-muted-foreground">Creado</dt><dd className="font-medium">{formatDateTime(order.createdAt)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Compromiso</dt><dd className="font-medium">{formatDate(order.dueDate)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Estado</dt><dd><ServiceOrderStatusBadge status={order.status} /></dd></div>
            </dl>
            {order.observations && (
              <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-warning">Observaciones</p>
                <p className="mt-1 text-foreground">{order.observations}</p>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="activo" className="mt-4">
          <SectionCard title="Activo del cliente" description="Ficha técnica del equipo intervenido.">
            {order.asset ? (
              <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div><dt className="text-xs text-muted-foreground">Tipo</dt><dd className="font-medium">{ASSET_TYPE_META[order.asset.type].label}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Fabricante</dt><dd className="font-medium">{order.asset.manufacturer}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Modelo</dt><dd className="font-medium">{order.asset.model}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Serie</dt><dd className="font-medium">{order.asset.serial}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Tag</dt><dd className="font-medium">{order.asset.tag}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Potencia / capacidad</dt><dd className="font-medium">{order.asset.ratedPower}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Tecnología</dt><dd className="font-medium">{order.asset.technology}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Ubicación</dt><dd className="font-medium">{order.asset.location}</dd></div>
              </dl>
            ) : (
              <EmptyState icon={Gauge} title="Sin activo asociado" description="El expediente no tiene un activo registrado." />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="ruta" className="mt-4">
          <SectionCard
            title="Hoja de ruta"
            description="Plan de partes, fases y secciones por donde pasa el servicio."
            actions={
              order.routeSheet ? (
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/hojas-de-ruta/${order.routeSheet.id}`}>Abrir detalle completo</Link>
                </Button>
              ) : undefined
            }
          >
            {order.routeSheet ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{order.routeSheet.code}</Badge>
                  <Badge variant="outline">{order.routeSheet.parts.length} partes</Badge>
                  <Badge variant="outline">{order.routeSheet.phases.length} fases</Badge>
                  <Badge variant="outline">{order.routeSheet.progress}% avance</Badge>
                </div>
                <ProgressBar value={order.routeSheet.progress} />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {order.routeSheet.parts.map((part) => (
                    <div key={part.id} className="rounded-xl border border-border/70 p-3">
                      <p className="text-sm font-medium text-foreground">{part.name}</p>
                      <p className="text-xs text-muted-foreground">{part.quantity} und. · Área actual: {part.areaId}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Route}
                title="Sin hoja de ruta"
                description="Genera la hoja de ruta desde una plantilla para ejecutar el servicio."
                action={
                  canManageServiceOrder(user) ? (
                    <Button
                      type="button"
                      onClick={() => {
                        const template = db.serviceTemplates.find((item) => item.scope === order.scope) ?? db.serviceTemplates[0];
                        if (!template) {
                          toast.error('No hay plantillas disponibles');
                          return;
                        }
                        const routeSheetId = store.createRouteSheetFromTemplate(order.id, template.id, user.id);
                        if (routeSheetId) {
                          toast.success('Hoja de ruta generada');
                          navigate(`/hojas-de-ruta/${routeSheetId}`);
                        }
                      }}
                    >
                      <Route /> Generar hoja de ruta
                    </Button>
                  ) : undefined
                }
              />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="calidad" className="mt-4">
          <SectionCard
            title="Calidad, NDT y pruebas"
            description="Registros de inspección, pruebas eléctricas, dimensionales y de balanceo."
            contentClassName="p-0"
          >
            <DataTable
              data={order.qualityRecords}
              columns={qualityColumns}
              getRowId={(record) => record.id}
              search={{ placeholder: 'Buscar por tipo, método o norma…', getText: (record) => `${record.type} ${record.method} ${record.standard}` }}
              actions={[
                {
                  label: 'Aprobar',
                  icon: CheckCircle2,
                  hidden: (record) => !canManageQuality(user) || record.result !== 'PENDING',
                  onSelect: (record) => {
                    store.updateQualityRecordResult(record.id, 'PASS', user.id);
                    toast.success('Registro aprobado');
                  },
                },
                {
                  label: 'Rechazar',
                  icon: ShieldAlert,
                  variant: 'destructive',
                  hidden: (record) => !canManageQuality(user) || record.result !== 'PENDING',
                  onSelect: (record) => {
                    store.updateQualityRecordResult(record.id, 'FAIL', user.id);
                    toast.info('Registro rechazado');
                  },
                },
              ]}
              pageSize={10}
              emptyTitle="Sin registros de calidad"
              emptyDescription="Los registros NDT y pruebas aparecerán aquí."
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="nc" className="mt-4">
          <SectionCard
            title="No conformidades"
            description="Hallazgos, acciones correctivas y cierre."
            contentClassName="p-0"
          >
            <DataTable
              data={order.nonConformities}
              columns={ncColumns}
              getRowId={(record) => record.id}
              search={{ placeholder: 'Buscar no conformidad…', getText: (record) => record.description }}
              actions={[
                {
                  label: 'Cerrar NC',
                  icon: CheckCircle2,
                  hidden: (record) => !canManageNonConformities(user) || record.status === 'CLOSED',
                  onSelect: (record) => {
                    store.updateNonConformityStatus(record.id, 'CLOSED', user.id);
                    toast.success('No conformidad cerrada');
                  },
                },
              ]}
              pageSize={10}
              emptyTitle="Sin no conformidades"
              emptyDescription="No hay hallazgos registrados para este expediente."
            />
          </SectionCard>
        </TabsContent>

        {order.fieldJob && (
          <TabsContent value="operacion" className="mt-4">
            <SectionCard
              title="Operación de campo"
              description="Sitio, permisos, cuadrilla, movilización y reporte."
              actions={canManageField(user) ? (
                <div className="flex flex-wrap gap-2">
                  {(['PLANNED', 'MOBILIZED', 'IN_EXECUTION', 'DEMOBILIZED', 'CLOSED'] as const).map((status) => (
                    <Button
                      key={status}
                      size="xs"
                      variant={order.fieldJob?.status === status ? 'default' : 'outline'}
                      onClick={() => {
                        store.updateFieldJobStatus(order.fieldJob!.id, status, user.id);
                        toast.success(`Campo actualizado a ${FIELD_STATUS_META[status].label}`);
                      }}
                    >
                      {FIELD_STATUS_META[status].label}
                    </Button>
                  ))}
                </div>
              ) : undefined}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <FieldStatusBadge status={order.fieldJob.status} />
                  <Badge variant="outline">{order.fieldJob.containers} contenedor(es)</Badge>
                  <Badge variant="outline">{order.fieldJob.cranes}</Badge>
                </div>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">Sitio</dt><dd className="font-medium">{order.fieldJob.siteName}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Ubicación</dt><dd className="font-medium">{order.fieldJob.location}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Permisos</dt><dd className="font-medium">{order.fieldJob.permits}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">AST</dt><dd className="font-medium">{order.fieldJob.riskAnalysis}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Cuadrilla</dt><dd className="font-medium">{order.fieldJob.crew.join(', ') || 'Sin asignar'}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Movilización</dt><dd className="font-medium">{order.fieldJob.mobilizationDate ? formatDate(order.fieldJob.mobilizationDate) : 'Pendiente'}</dd></div>
                </dl>
                {order.fieldJob.report && (
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reporte de campo</p>
                    <p className="mt-1 text-foreground">{order.fieldJob.report}</p>
                  </div>
                )}
              </div>
            </SectionCard>
          </TabsContent>
        )}

        {order.project && (
          <TabsContent value="operacion" className="mt-4">
            <SectionCard
              title="Proyecto electromecánico"
              description="Ingeniería, procura, construcción y comisionamiento."
              actions={canManageProjects(user) ? (
                <Button
                  size="sm"
                  onClick={() => {
                    const index = PROJECT_PHASE_ORDER.indexOf(order.project!.phase);
                    const nextPhase = PROJECT_PHASE_ORDER[Math.min(index + 1, PROJECT_PHASE_ORDER.length - 1)];
                    store.updateProjectPhase(order.project!.id, nextPhase, Math.min(100, order.project!.progress + 20), user.id);
                    toast.success(`Proyecto actualizado a ${PROJECT_PHASE_META[nextPhase].label}`);
                  }}
                >
                  <ChevronRight /> Avanzar fase
                </Button>
              ) : undefined}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ProjectPhaseBadge phase={order.project.phase} />
                  <Badge variant="outline">{order.project.progress}% avance</Badge>
                </div>
                <ProgressBar value={order.project.progress} />
                <div className="space-y-2">
                  {order.project.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm">
                      <span className="text-foreground">{milestone.name}</span>
                      <Badge variant="outline">{milestone.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </TabsContent>
        )}

        {order.supplyOrder && (
          <TabsContent value="operacion" className="mt-4">
            <SectionCard
              title="Suministro de componentes"
              description="Cotización, compra, inspección y entrega."
              actions={canManageSupply(user) ? (
                <Button
                  size="sm"
                  onClick={() => {
                    const index = SUPPLY_ORDER.indexOf(order.supplyOrder!.status);
                    const nextStatus = SUPPLY_ORDER[Math.min(index + 1, SUPPLY_ORDER.length - 1)];
                    store.updateSupplyStatus(order.supplyOrder!.id, nextStatus, user.id);
                    toast.success(`Suministro actualizado a ${SUPPLY_STATUS_META[nextStatus].label}`);
                  }}
                >
                  <ChevronRight /> Avanzar estado
                </Button>
              ) : undefined}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <SupplyStatusBadge status={order.supplyOrder.status} />
                  {order.supplyOrder.supplier && <Badge variant="outline">{order.supplyOrder.supplier}</Badge>}
                  {order.supplyOrder.purchaseOrder && <Badge variant="outline">{order.supplyOrder.purchaseOrder}</Badge>}
                </div>
                <div className="space-y-2">
                  {order.supplyOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm">
                      <span className="text-foreground">{item.name} <span className="text-xs text-muted-foreground">({item.code})</span></span>
                      <span className="text-xs text-muted-foreground">{item.quantity} und.</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </TabsContent>
        )}

        <TabsContent value="auditoria" className="mt-4">
          <SectionCard title="Auditoría del expediente" description="Eventos registrados para este servicio.">
            {orderAudit.length === 0 ? (
              <EmptyState icon={FileCheck2} title="Sin eventos" description="No hay movimientos registrados." />
            ) : (
              <Timeline
                items={orderAudit.map((entry) => ({
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
    </div>
  );
}
