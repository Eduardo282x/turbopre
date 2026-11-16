import { CheckCircle2, ClipboardCheck, Clock3, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PhaseStatusBadge, RouteStatusBadge } from '@/components/common/badges';
import { FormDialog } from '@/components/common/form-dialog';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
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
import { AREA_BY_ID } from '@/features/preview/config';
import { getPhaseContexts, type PhaseWithContext } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { formatDate } from '@/lib/formatters';
import { canCompletePhase } from '@/lib/permissions';
import { AddInspectionDialog } from '@/pages/route-sheets/add-inspection-dialog';
import { CompletePhaseDialog } from '@/pages/route-sheets/complete-phase-dialog';

export function InspectionsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const addInspectionPhase = usePreviewStore((state) => state.addInspectionPhase);
  const completePhase = usePreviewStore((state) => state.completePhase);
  const [routeSelectOpen, setRouteSelectOpen] = useState(false);
  const [routeId, setRouteId] = useState('');
  const [inspectionRouteId, setInspectionRouteId] = useState<string | null>(null);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [context, setContext] = useState<PhaseWithContext | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);

  if (!user) return null;

  const inspectionContexts = getPhaseContexts(db).filter(
    (contextItem) => contextItem.phase.type === 'INSPECTION',
  );
  const pending = inspectionContexts.filter((item) => item.phase.status === 'PENDING').length;
  const inProgress = inspectionContexts.filter((item) => item.phase.status === 'IN_PROGRESS').length;
  const completed = inspectionContexts.filter((item) => item.phase.status === 'COMPLETED').length;

  const candidateRoutes = db.routeSheets.filter((route) =>
    ['APPROVED', 'IN_PROGRESS', 'IN_QUALITY'].includes(route.status),
  );
  const inspectionRoute = inspectionRouteId
    ? db.routeSheets.find((route) => route.id === inspectionRouteId)
    : undefined;
  const inspectionParts = inspectionRoute
    ? db.parts.filter((part) => part.routeSheetId === inspectionRoute.id)
    : [];

  const openComplete = (item: PhaseWithContext) => {
    setContext(item);
    setCompleteOpen(true);
  };

  const columns: DataTableColumn<PhaseWithContext>[] = [
    {
      id: 'route',
      header: 'Hoja de ruta',
      cell: (item) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{item.route.code}</p>
          <p className="max-w-56 truncate text-xs text-muted-foreground">{item.component.name}</p>
          <p className="text-[11px] text-muted-foreground/70">{item.client?.name ?? 'Sin cliente'}</p>
        </div>
      ),
      sortable: true,
      sortValue: (item) => item.route.code,
    },
    {
      id: 'part',
      header: 'Parte',
      cell: (item) => <span className="text-sm">{item.part.name}</span>,
      hideOnMobile: true,
    },
    {
      id: 'phase',
      header: 'Inspección',
      cell: (item) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{item.phase.name}</p>
          <p className="max-w-64 truncate text-xs text-muted-foreground">{item.phase.description}</p>
        </div>
      ),
      sortable: true,
      sortValue: (item) => item.phase.name,
    },
    {
      id: 'area',
      header: 'Área',
      cell: (item) => <span className="text-xs">{AREA_BY_ID[item.phase.areaId].shortName}</span>,
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (item) => <PhaseStatusBadge status={item.phase.status} />,
      sortable: true,
      sortValue: (item) => item.phase.status,
    },
    {
      id: 'routeStatus',
      header: 'Hoja',
      cell: (item) => <RouteStatusBadge status={item.route.status} />,
      hideOnMobile: true,
    },
    {
      id: 'date',
      header: 'Fecha',
      cell: (item) => (
        <span className="text-xs text-muted-foreground">
          {item.phase.completedAt ? formatDate(item.phase.completedAt) : 'Pendiente'}
        </span>
      ),
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Taller"
        title="Inspecciones"
        description="Fases de inspección asignadas a las áreas, con hallazgos y evidencia fotográfica."
        actions={
          <Button
            onClick={() => {
              setRouteId(candidateRoutes[0]?.id ?? '');
              setRouteSelectOpen(true);
            }}
          >
            <Plus /> Nueva inspección
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Pendientes" value={pending} hint="Esperando ejecución" icon={Clock3} tone="warning" />
        <KpiCard label="En proceso" value={inProgress} hint="Inspecciones activas" icon={Search} tone="accent" />
        <KpiCard label="Completadas" value={completed} hint="Con evidencia registrada" icon={CheckCircle2} tone="success" />
      </div>

      <DataTable
        data={inspectionContexts}
        columns={columns}
        getRowId={(item) => item.phase.id}
        search={{
          placeholder: 'Buscar por hoja, componente, parte o área…',
          getText: (item) =>
            `${item.route.code} ${item.component.name} ${item.part.name} ${item.phase.name} ${AREA_BY_ID[item.phase.areaId].name}`,
        }}
        actions={[
          {
            label: 'Completar inspección',
            icon: CheckCircle2,
            hidden: (item) =>
              !canCompletePhase(user, item.phase) ||
              item.phase.status === 'COMPLETED' ||
              item.phase.status === 'BLOCKED',
            onSelect: openComplete,
          },
        ]}
        pageSize={10}
        emptyTitle="Sin inspecciones"
        emptyDescription="Crea una inspección adicional desde una hoja de ruta aprobada."
        caption="Inspecciones de taller"
      />

      <FormDialog
        open={routeSelectOpen}
        onOpenChange={setRouteSelectOpen}
        title="Seleccionar hoja de ruta"
        description="Elige el expediente al que pertenecerá la inspección."
        footer={
          <>
            <Button variant="outline" onClick={() => setRouteSelectOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!routeId) {
                  toast.error('Selecciona una hoja de ruta');
                  return;
                }
                setInspectionRouteId(routeId);
                setRouteSelectOpen(false);
                setInspectionOpen(true);
              }}
            >
              <ClipboardCheck /> Continuar
            </Button>
          </>
        }
      >
        <Select value={routeId} onValueChange={setRouteId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una hoja de ruta" />
          </SelectTrigger>
          <SelectContent>
            {candidateRoutes.map((route) => (
              <SelectItem key={route.id} value={route.id}>
                {route.code} · {db.components.find((component) => component.id === route.componentId)?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormDialog>

      <AddInspectionDialog
        open={inspectionOpen}
        onOpenChange={setInspectionOpen}
        parts={inspectionParts}
        onSubmit={(input) => {
          if (!inspectionRouteId) return;
          addInspectionPhase(inspectionRouteId, input.partId, input.areaId, user.id, input.description);
          toast.success('Inspección creada');
        }}
      />

      <CompletePhaseDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        context={context}
        onSubmit={(payload) => {
          if (!context) return;
          completePhase(context.phase.id, user.id, payload);
          toast.success('Inspección completada');
        }}
      />
    </div>
  );
}
