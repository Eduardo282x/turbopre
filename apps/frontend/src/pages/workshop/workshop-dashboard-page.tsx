import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Factory,
  Package,
  Plus,
  Timer,
  Wrench,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { InspectionStatusBadge } from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Button } from '@/components/ui/button';
import { PROCESSES } from '@/features/preview/config';
import {
  getInspectionMetrics,
  getInspectionsForWorkshop,
  getProcessWorkloadData,
  getRouteMetrics,
  getServiceOrderMetrics,
  getWarehousePendingItems,
} from '@/features/preview/store/selectors';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { InspectionWithRelations } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';

export function WorkshopDashboardPage() {
  const db = usePreviewStore((state) => state.db);
  const navigate = useNavigate();
  const inspections = getInspectionsForWorkshop(db);
  const inspectionMetrics = getInspectionMetrics(db);
  const orderMetrics = getServiceOrderMetrics(db);
  const routeMetrics = getRouteMetrics(db);
  const workload = getProcessWorkloadData(db);
  const sparePending = getWarehousePendingItems(db).length;

  const columns: DataTableColumn<InspectionWithRelations>[] = [
    {
      id: 'inspection',
      header: 'Inspección',
      cell: (inspection) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{inspection.code}</p>
          <p className="font-mono text-[11px] text-muted-foreground">ODS {inspection.serviceOrder.code}</p>
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
          <p className="font-medium text-foreground">{inspection.client?.name ?? '—'}</p>
          <p className="text-muted-foreground">
            {inspection.asset?.manufacturer} {inspection.asset?.model}
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
      id: 'date',
      header: 'Creada',
      cell: (inspection) => <span className="text-xs text-muted-foreground">{formatDate(inspection.createdAt)}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (inspection) => new Date(inspection.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Servicio de taller"
        title="Panel de taller"
        description="Inspecciones, procesos de taller y carga de trabajo por puesto."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/ordenes-servicio">
                <ClipboardCheck /> Órdenes de servicio
              </Link>
            </Button>
            <Button asChild>
              <Link to="/taller/inspecciones">
                <Plus /> Nueva inspección
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="ODS recibidas" value={orderMetrics.total} hint="Órdenes de Ventas" icon={ClipboardCheck} tone="accent" />
        <KpiCard label="En inspección" value={inspectionMetrics.inProgress} hint="Tareas en curso" icon={Timer} tone="info" />
        <KpiCard label="Hojas en ejecución" value={routeMetrics.active} hint="Liberadas a taller" icon={Wrench} tone="warning" />
        <KpiCard label="Repuestos pendientes" value={sparePending} hint="Por despachar o procurar" icon={Package} tone="success" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PROCESSES.filter((process) => process.group === 'workshop').map((process) => {
          const active = workload.find((item) => item.processId === process.id)?.value ?? 0;
          return (
            <div key={process.id} className="rounded-xl border border-border/70 bg-card/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{process.name}</p>
                <span className="size-2 rounded-full" style={{ backgroundColor: process.color }} />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{active}</p>
              <p className="text-xs text-muted-foreground">
                {active > 0 ? 'tarea(s) activa(s)' : 'Sin carga activa'}
              </p>
            </div>
          );
        })}
      </div>

      {inspectionMetrics.completed > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
          <CheckCircle2 className="size-5 text-warning" />
          <p className="flex-1 text-foreground">
            Hay <strong>{inspectionMetrics.completed}</strong> inspección(es) completada(s) esperando tu aprobación.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/taller/inspecciones">Revisar inspecciones</Link>
          </Button>
        </div>
      )}

      <DataTable
        data={inspections}
        columns={columns}
        getRowId={(inspection) => inspection.id}
        search={{
          placeholder: 'Buscar por inspección, ODS, cliente o equipo…',
          getText: (inspection) =>
            `${inspection.code} ${inspection.serviceOrder.code} ${inspection.client?.name ?? ''} ${inspection.asset?.model ?? ''}`,
        }}
        actions={[
          {
            label: 'Ver inspección',
            icon: Eye,
            onSelect: (inspection) => navigate(`/taller/inspecciones/${inspection.id}`),
          },
        ]}
        onRowClick={(inspection) => navigate(`/taller/inspecciones/${inspection.id}`)}
        pageSize={10}
        emptyTitle="Sin inspecciones"
        emptyDescription="Cuando Taller reciba una ODS podrá crear la primera inspección."
        caption="Inspecciones del taller"
      />

      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
        <Factory className="size-4 shrink-0" />
        <p>
          Taller crea la inspección desde la ODS. Los operadores y Calidad ejecutan las tareas; luego Taller aprueba
          y la inspección pasa a Ingeniería.
        </p>
      </div>
    </div>
  );
}
