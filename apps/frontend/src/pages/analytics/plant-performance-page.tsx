import { Activity, CheckCircle2, Clock3, Gauge } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import { DonutChart } from '@/components/charts/donut-chart';
import { SimpleBarChart } from '@/components/charts/simple-bar-chart';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { SectionCard } from '@/components/common/section-card';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { PROCESSES } from '@/features/preview/config';
import {
  getClientVolumeData,
  getProcessPerformanceData,
  getProcessWorkloadData,
  getRouteMetrics,
  getRouteStatusChartData,
} from '@/features/preview/store/selectors';
import { usePreviewStore } from '@/features/preview/store/preview-store';

interface ProcessMetric {
  id: string;
  name: string;
  activeTasks: number;
  completedTasks: number;
  averageHours: number;
}

export function PlantPerformancePage() {
  const db = usePreviewStore((state) => state.db);
  const metrics = getRouteMetrics(db);
  const statusData = getRouteStatusChartData(db);
  const workload = getProcessWorkloadData(db);
  const performance = getProcessPerformanceData(db);
  const topClients = getClientVolumeData(db);

  const processMetrics: ProcessMetric[] = PROCESSES.map((process) => {
    const result = performance.find((item) => item.processId === process.id);
    return {
      id: process.id,
      name: process.name,
      activeTasks: workload.find((item) => item.processId === process.id)?.value ?? 0,
      completedTasks: result?.completed ?? 0,
      averageHours: result?.hours ?? 0,
    };
  });

  const columns: DataTableColumn<ProcessMetric>[] = [
    {
      id: 'process',
      header: 'Proceso',
      cell: (process) => <span className="font-medium text-foreground">{process.name}</span>,
      sortable: true,
      sortValue: (process) => process.name,
    },
    {
      id: 'active',
      header: 'Tareas activas',
      cell: (process) => <span className="font-mono text-sm">{process.activeTasks}</span>,
      sortable: true,
      sortValue: (process) => process.activeTasks,
    },
    {
      id: 'completed',
      header: 'Completadas',
      cell: (process) => <span className="font-mono text-sm">{process.completedTasks}</span>,
      sortable: true,
      sortValue: (process) => process.completedTasks,
    },
    {
      id: 'hours',
      header: 'Horas promedio',
      cell: (process) => (
        <span className={process.averageHours > 4 ? 'text-warning' : 'text-success'}>
          {process.averageHours > 0 ? `${process.averageHours} h` : 'Sin datos'}
        </span>
      ),
      sortable: true,
      sortValue: (process) => process.averageHours,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Análisis"
        title="Rendimiento de planta"
        description="Carga de trabajo y tiempos por proceso. Las tareas se agrupan por etapa y puesto."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Hojas totales" value={metrics.total} hint="Hojas registradas" icon={Gauge} tone="accent" />
        <KpiCard label="Activas" value={metrics.active} hint="Aprobadas, en taller o calidad" icon={Activity} tone="info" />
        <KpiCard label="Tareas completadas" value={metrics.completedTasks} hint={`de ${metrics.totalTasks} tareas`} icon={CheckCircle2} tone="success" />
        <KpiCard label="En calidad" value={metrics.inQuality} hint="Pendientes de visto bueno" icon={Clock3} tone="warning" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Horas promedio por proceso" description="Duración media de las tareas completadas.">
          <SimpleBarChart
            data={performance.map((item) => ({ name: item.name, value: item.hours, color: item.color }))}
            height={300}
            valueLabel="Horas"
          />
        </ChartCard>
        <ChartCard title="Carga por proceso" description="Tareas pendientes o en proceso.">
          <DonutChart
            data={workload}
            centerValue={workload.reduce((sum, item) => sum + item.value, 0)}
            centerLabel="tareas activas"
            height={300}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Flujo de hojas de ruta" description="Distribución por estado.">
          <SimpleBarChart data={statusData} height={280} valueLabel="Hojas" />
        </ChartCard>
        <ChartCard title="Volumen por cliente" description="Órdenes de servicio por empresa.">
          <SimpleBarChart data={topClients} horizontal height={280} valueLabel="ODS" />
        </ChartCard>
      </div>

      <SectionCard title="Detalle por proceso" description="Indicadores operativos de cada proceso." contentClassName="p-0">
        <DataTable
          data={processMetrics}
          columns={columns}
          getRowId={(process) => process.id}
          search={{ placeholder: 'Buscar proceso…', getText: (process) => process.name }}
          pageSize={10}
          emptyTitle="Sin datos por proceso"
          emptyDescription="Las métricas aparecerán cuando existan tareas registradas."
          caption="Indicadores por proceso"
        />
      </SectionCard>
    </div>
  );
}
