import { CheckCircle2, Eye, Factory, Gauge, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ServiceModeBadge, ServiceOrderStatusBadge } from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { getAreaWorkloadData, getServiceOrderMetrics, getServiceOrdersWithRelations } from '@/features/preview/store/selectors';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { ServiceOrderWithRelations } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';

export function WorkshopDashboardPage() {
  const db = usePreviewStore((state) => state.db);
  const navigate = useNavigate();
  const orders = getServiceOrdersWithRelations(db).filter((order) => order.mode === 'SHOP');
  const metrics = getServiceOrderMetrics(db);
  const workload = getAreaWorkloadData(db);

  const sections = [
    { name: 'Izamiento y ensamble', areaId: 'assembly' as const },
    { name: 'Mecanizado mayor', areaId: 'machining_major' as const },
    { name: 'Mecanizado menor', areaId: 'machining_minor' as const },
    { name: 'Balanceo', areaId: 'balancing' as const },
    { name: 'Soldaduras especiales', areaId: 'special_welding' as const },
    { name: 'Generadores eléctricos', areaId: 'generator_shop' as const },
    { name: 'Tratamiento térmico y recubrimientos', areaId: 'thermal_coatings' as const },
    { name: 'Metrología', areaId: 'metrology' as const },
    { name: 'Almacén de materiales', areaId: 'material_warehouse' as const },
    { name: 'Administración', areaId: 'admin' as const },
  ];

  const columns: DataTableColumn<ServiceOrderWithRelations>[] = [
    {
      id: 'order',
      header: 'Expediente',
      cell: (order) => (
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">{order.code}</p>
          <p className="text-xs text-muted-foreground">{order.asset?.manufacturer} {order.asset?.model} · {order.asset?.tag}</p>
          <div className="flex flex-wrap gap-1">
            <ServiceModeBadge mode={order.mode} />
            <ServiceOrderStatusBadge status={order.status} />
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (order) => order.code,
    },
    {
      id: 'scope',
      header: 'Alcance',
      cell: (order) => <span className="text-xs">{order.description}</span>,
      hideOnMobile: true,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (order) => <ProgressBar value={order.progress} className="w-28" />,
    },
    {
      id: 'due',
      header: 'Compromiso',
      cell: (order) => <span className="text-xs text-muted-foreground">{formatDate(order.dueDate)}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (order) => new Date(order.dueDate),
    },
    {
      id: 'nc',
      header: 'NC',
      cell: (order) => (
        <span className={order.openNonConformities > 0 ? 'font-semibold text-destructive' : 'text-muted-foreground'}>
          {order.openNonConformities}
        </span>
      ),
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Taller"
        title="Panel de taller"
        description="Expedientes en las diez secciones especializadas: izamiento, mecanizado, balanceo, soldadura, generadores, tratamientos y más."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Expedientes de taller" value={orders.length} hint="En secciones especializadas" icon={Factory} tone="accent" />
        <KpiCard label="En ejecución" value={orders.filter((order) => order.status === 'IN_EXECUTION').length} hint="Trabajo activo" icon={Wrench} tone="info" />
        <KpiCard label="En calidad" value={orders.filter((order) => order.status === 'IN_QUALITY').length} hint="Pendientes de liberación" icon={Gauge} tone="warning" />
        <KpiCard label="Listos / entregados" value={orders.filter((order) => ['READY_FOR_DELIVERY', 'DELIVERED', 'CLOSED'].includes(order.status)).length} hint="Cerrados o por entregar" icon={CheckCircle2} tone="success" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {sections.map((section) => {
          const active = workload.find((item) => item.areaId === section.areaId)?.value ?? 0;
          return (
            <div key={section.areaId} className="rounded-xl border border-border/70 bg-card/70 p-3">
              <p className="text-xs font-medium text-foreground">{section.name}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {active > 0 ? `${active} fase(s) activa(s)` : 'Sin carga activa'}
              </p>
            </div>
          );
        })}
      </div>

      <DataTable
        data={orders}
        columns={columns}
        getRowId={(order) => order.id}
        search={{
          placeholder: 'Buscar por expediente, activo o alcance…',
          getText: (order) => `${order.code} ${order.asset?.model ?? ''} ${order.description}`,
        }}
        actions={[
          { label: 'Ver expediente', icon: Eye, onSelect: (order) => navigate(`/expedientes/${order.id}`) },
        ]}
        onRowClick={(order) => navigate(`/expedientes/${order.id}`)}
        pageSize={10}
        emptyTitle="Sin expedientes de taller"
        emptyDescription="Crea un expediente en modo Taller para comenzar."
        caption="Expedientes de taller"
      />

      <p className="text-xs text-muted-foreground">
        {metrics.total} expedientes totales · {metrics.openNonConformities} no conformidades abiertas · {metrics.pendingQualityRecords} pruebas pendientes
      </p>
    </div>
  );
}
