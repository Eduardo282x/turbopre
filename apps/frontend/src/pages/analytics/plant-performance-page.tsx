import { Activity, Clock3, Gauge, Layers } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import { DonutChart } from '@/components/charts/donut-chart';
import { SimpleBarChart } from '@/components/charts/simple-bar-chart';
import { PageHeader } from '@/components/common/page-header';
import { KpiCard } from '@/components/common/kpi-card';
import { SectionCard } from '@/components/common/section-card';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { AREAS } from '@/features/preview/config';
import {
  getAreaPerformanceData,
  getAreaWorkloadData,
  getClientVolumeData,
  getRouteMetrics,
  getStatusChartData,
} from '@/features/preview/store/selectors';
import { usePreviewStore } from '@/features/preview/store/preview-store';

interface AreaMetric {
  id: string;
  name: string;
  activePhases: number;
  completedPhases: number;
  averageHours: number;
}

export function PlantPerformancePage() {
  const db = usePreviewStore((state) => state.db);

  const metrics = getRouteMetrics(db);
  const statusData = getStatusChartData(db);
  const areaWorkload = getAreaWorkloadData(db);
  const areaPerformance = getAreaPerformanceData(db);
  const topClients = getClientVolumeData(db);

  const areaMetrics: AreaMetric[] = AREAS.filter((area) =>
    ['planning', 'engineering', 'turbines', 'machining', 'welding', 'generators', 'workshop', 'quality'].includes(area.id),
  ).map((area) => {
    const performance = areaPerformance.find((item) => item.areaId === area.id);
    return {
      id: area.id,
      name: area.name,
      activePhases: db.phases.filter((phase) => phase.areaId === area.id && phase.status !== 'COMPLETED').length,
      completedPhases: db.phases.filter((phase) => phase.areaId === area.id && phase.status === 'COMPLETED').length,
      averageHours: performance?.hours ?? 0,
    };
  });

  const columns: DataTableColumn<AreaMetric>[] = [
    {
      id: 'area',
      header: 'Área',
      cell: (area) => <span className="font-medium text-foreground">{area.name}</span>,
      sortable: true,
      sortValue: (area) => area.name,
    },
    {
      id: 'active',
      header: 'Fases activas',
      cell: (area) => <span className="font-mono text-sm">{area.activePhases}</span>,
      sortable: true,
      sortValue: (area) => area.activePhases,
    },
    {
      id: 'completed',
      header: 'Completadas',
      cell: (area) => <span className="font-mono text-sm">{area.completedPhases}</span>,
      sortable: true,
      sortValue: (area) => area.completedPhases,
    },
    {
      id: 'hours',
      header: 'Horas promedio',
      cell: (area) => (
        <span className={area.averageHours > 4 ? 'text-warning' : 'text-success'}>
          {area.averageHours > 0 ? `${area.averageHours} h` : 'Sin datos'}
        </span>
      ),
      sortable: true,
      sortValue: (area) => area.averageHours,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Análisis"
        title="Rendimiento de planta"
        description="Tiempos por área, carga de trabajo y distribución de las hojas de ruta."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Hojas totales" value={metrics.total} hint="Expedientes registrados" icon={Layers} tone="accent" />
        <KpiCard label="Activas" value={metrics.active} hint="En proceso o calidad" icon={Activity} tone="info" />
        <KpiCard label="Fases completadas" value={metrics.completedPhases} hint={`de ${metrics.totalPhases} fases`} icon={Gauge} tone="success" />
        <KpiCard label="En calidad" value={metrics.inQuality} hint="Pendientes de liberación" icon={Clock3} tone="warning" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Horas promedio por área" description="Duración media de las fases completadas.">
          <SimpleBarChart data={areaPerformance.map((item) => ({ name: item.name, value: item.hours, color: item.color }))} height={300} valueLabel="Horas" />
        </ChartCard>
        <ChartCard title="Carga por área" description="Fases pendientes o en proceso.">
          <DonutChart
            data={areaWorkload}
            centerValue={areaWorkload.reduce((sum, item) => sum + item.value, 0)}
            centerLabel="fases activas"
            height={300}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Flujo de hojas de ruta" description="Distribución por estado.">
          <SimpleBarChart data={statusData} height={280} valueLabel="Hojas" />
        </ChartCard>
        <ChartCard title="Volumen por cliente" description="Hojas de ruta por empresa.">
          <SimpleBarChart data={topClients} horizontal height={280} valueLabel="Hojas" />
        </ChartCard>
      </div>

      <SectionCard title="Detalle por área" description="Indicadores operativos de cada área." contentClassName="p-0">
        <DataTable
          data={areaMetrics}
          columns={columns}
          getRowId={(area) => area.id}
          search={{ placeholder: 'Buscar área…', getText: (area) => area.name }}
          pageSize={10}
          emptyTitle="Sin datos por área"
          emptyDescription="Las métricas aparecerán cuando existan fases registradas."
          caption="Indicadores por área"
        />
      </SectionCard>
    </div>
  );
}
