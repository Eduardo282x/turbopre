import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  Plus,
  Timer,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { InspectionStatusBadge } from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { SectionCard } from '@/components/common/section-card';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INSPECTION_STATUS_META } from '@/features/preview/config';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { useInspections } from '@/hooks/use-inspections';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/formatters';
import { canCreateInspection, canManageRoutes } from '@/lib/permissions';
import type { CreateInspectionInput, InspectionRecord } from '@turbopre/shared';
import { inspectionsService } from '@/services/inspections/inspections.service';
import { InspectionFormDialog } from './inspection-form-dialog';

export function InspectionsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const queryClient = useQueryClient();
  const inspectionsQuery = useInspections();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [defaultOrderId, setDefaultOrderId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const orderId = searchParams.get('ods');
    if (!orderId) return;
    setDefaultOrderId(orderId);
    setFormOpen(true);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const createMutation = useMutation({
    mutationFn: (input: CreateInspectionInput) => inspectionsService.create(input),
    onSuccess: (inspection) => {
      void queryClient.invalidateQueries({ queryKey: ['inspections'] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Inspección creada y tareas asignadas', {
        description: inspection.code,
      });
      setFormOpen(false);
      navigate(`/taller/inspecciones/${inspection.id}`);
    },
    onError: (error) =>
      toast.error('No se pudo crear la inspección', {
        description: getApiErrorMessage(error),
      }),
  });

  const inspections = useMemo(
    () => inspectionsQuery.data ?? [],
    [inspectionsQuery.data],
  );
  const filtered = useMemo(
    () =>
      inspections.filter(
        (inspection) =>
          statusFilter === 'all' || inspection.status === statusFilter,
      ),
    [inspections, statusFilter],
  );

  if (!user) return null;

  const metrics = {
    total: inspections.length,
    inProgress: inspections.filter((inspection) => inspection.status === 'IN_PROGRESS').length,
    completed: inspections.filter((inspection) => inspection.status === 'COMPLETED').length,
    approved: inspections.filter((inspection) => inspection.status === 'APPROVED').length,
    rejected: inspections.filter((inspection) => inspection.status === 'REJECTED').length,
  };
  const previewInspectionIds = new Set(db.inspections.map((inspection) => inspection.id));
  const previewRouteInspectionIds = new Set(
    db.routeSheets.map((route) => route.inspectionId),
  );
  const approvedPending = inspections.filter(
    (inspection) =>
      inspection.status === 'APPROVED' &&
      previewInspectionIds.has(inspection.id) &&
      !previewRouteInspectionIds.has(inspection.id),
  );

  const columns: DataTableColumn<InspectionRecord>[] = [
    {
      id: 'inspection',
      header: 'Inspección',
      cell: (inspection) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{inspection.code}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            ODS {inspection.serviceOrder.orderNumber}
          </p>
        </div>
      ),
      sortable: true,
      sortValue: (inspection) => inspection.code,
    },
    {
      id: 'client',
      header: 'Cliente / equipo',
      cell: (inspection) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{inspection.serviceOrder.clientName}</p>
          <p className="text-muted-foreground">
            {inspection.serviceOrder.equipmentCode} · {inspection.serviceOrder.equipmentName}
          </p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (inspection) => <InspectionStatusBadge status={inspection.status} />,
      sortable: true,
      sortValue: (inspection) => inspection.status,
    },
    {
      id: 'progress',
      header: 'Tareas',
      cell: (inspection) => (
        <ProgressBar
          value={inspection.progress}
          label={`${inspection.completedTasks} de ${inspection.totalTasks}`}
          className="w-36"
        />
      ),
      hideOnMobile: true,
    },
    {
      id: 'created',
      header: 'Creada',
      cell: (inspection) => (
        <div className="text-xs text-muted-foreground">
          <p>{formatDate(inspection.createdAt)}</p>
          <p>{inspection.createdBy.name}</p>
        </div>
      ),
      hideOnMobile: true,
      sortable: true,
      sortValue: (inspection) => new Date(inspection.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Servicio de taller"
        title="Inspecciones"
        description="Taller recibe la ODS y crea las tareas de inspección por proceso, puesto y etapa. Calidad participa siempre."
        actions={
          canCreateInspection(user) ? (
            <Button
              onClick={() => {
                setDefaultOrderId(undefined);
                setFormOpen(true);
              }}
            >
              <Plus /> Nueva inspección
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Inspecciones"
          value={metrics.total}
          hint="Recibidas desde ODS"
          icon={ClipboardCheck}
          tone="accent"
        />
        <KpiCard
          label="En ejecución"
          value={metrics.inProgress}
          hint="Tareas en curso"
          icon={Timer}
          tone="info"
        />
        <KpiCard
          label="Aprobadas"
          value={metrics.approved}
          hint="Listas para Ingeniería"
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="Rechazadas"
          value={metrics.rejected}
          hint="Requieren corrección"
          icon={XCircle}
          tone="danger"
        />
      </div>

      {approvedPending.length > 0 && canManageRoutes(user) && (
        <SectionCard
          title="Inspecciones aprobadas pendientes de hoja de ruta"
          description="Ingeniería puede crear la hoja de ruta. Los pasos de inspección se copiarán como realizados."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {approvedPending.map((inspection) => (
              <div key={inspection.id} className="rounded-xl border border-border/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{inspection.code}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {inspection.serviceOrder.clientName} ·{' '}
                      {inspection.serviceOrder.equipmentName}
                    </p>
                  </div>
                  <InspectionStatusBadge status={inspection.status} />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {inspection.completedTasks} tareas de inspección completadas
                </p>
                <Button size="sm" asChild className="mt-3 w-full">
                  <Link to={`/hojas-de-ruta/nueva?inspeccion=${inspection.id}`}>
                    <FileText /> Crear hoja de ruta
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {metrics.completed > 0 && canCreateInspection(user) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
          <CheckCircle2 className="size-5 text-warning" />
          <p className="flex-1 text-foreground">
            Hay <strong>{metrics.completed}</strong> inspección(es) completada(s) esperando la
            aprobación de Taller.
          </p>
          <Button variant="outline" size="sm" onClick={() => setStatusFilter('COMPLETED')}>
            Ver completadas
          </Button>
        </div>
      )}

      {inspectionsQuery.isError && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {getApiErrorMessage(inspectionsQuery.error, 'No se pudieron cargar las inspecciones')}
        </p>
      )}

      <DataTable
        data={filtered}
        columns={columns}
        getRowId={(inspection) => inspection.id}
        isLoading={inspectionsQuery.isLoading}
        search={{
          placeholder: 'Buscar por inspección, ODS, cliente o equipo…',
          getText: (inspection) =>
            `${inspection.code} ${inspection.serviceOrder.orderNumber} ${inspection.serviceOrder.clientName} ${inspection.serviceOrder.equipmentCode} ${inspection.serviceOrder.equipmentName}`,
        }}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger size="sm" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(INSPECTION_STATUS_META).map(([status, meta]) => (
                <SelectItem key={status} value={status}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        actions={[
          {
            label: 'Ver inspección',
            icon: Eye,
            onSelect: (inspection) =>
              navigate(`/taller/inspecciones/${inspection.id}`),
          },
        ]}
        onRowClick={(inspection) => navigate(`/taller/inspecciones/${inspection.id}`)}
        pageSize={10}
        emptyTitle="Sin inspecciones"
        emptyDescription="Taller puede crear una inspección desde una orden de servicio."
        caption="Inspecciones de taller"
      />

      <InspectionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultOrderId={defaultOrderId}
        pending={createMutation.isPending}
        onSubmit={(input) => createMutation.mutate(input)}
      />
    </div>
  );
}
