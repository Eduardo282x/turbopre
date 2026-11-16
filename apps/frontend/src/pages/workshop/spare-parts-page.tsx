import { CheckCircle2, Package, Plus, Truck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SparePartStatusBadge } from '@/components/common/badges';
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
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { Component, RouteSheet, SparePart } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';
import { canDispatchSparePart, canRequestSparePart } from '@/lib/permissions';
import { AddSparePartDialog } from '@/pages/route-sheets/add-spare-part-dialog';

interface SpareRow extends SparePart {
  route?: RouteSheet;
  component?: Component;
}

export function SparePartsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const addSparePart = usePreviewStore((state) => state.addSparePart);
  const updateSparePartStatus = usePreviewStore((state) => state.updateSparePartStatus);
  const [routeId, setRouteId] = useState('');
  const [routeSelectOpen, setRouteSelectOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  if (!user) return null;

  const rows: SpareRow[] = db.spareParts
    .map((spare) => {
      const route = db.routeSheets.find((item) => item.id === spare.routeSheetId);
      return {
        ...spare,
        route,
        component: route ? db.components.find((component) => component.id === route.componentId) : undefined,
      };
    })
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  const pending = rows.filter((row) => row.status === 'PENDING').length;
  const approved = rows.filter((row) => row.status === 'APPROVED').length;
  const dispatched = rows.filter((row) => row.status === 'DISPATCHED').length;

  const candidateRoutes = db.routeSheets.filter((route) => canRequestSparePart(user, route));
  const selectedRoute = db.routeSheets.find((route) => route.id === selectedRouteId);
  const selectedParts = selectedRoute ? db.parts.filter((part) => part.routeSheetId === selectedRoute.id) : [];

  const columns: DataTableColumn<SpareRow>[] = [
    {
      id: 'spare',
      header: 'Repuesto',
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.code}</p>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.name,
    },
    {
      id: 'route',
      header: 'Hoja de ruta',
      cell: (row) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{row.route?.code ?? '—'}</p>
          <p className="max-w-48 truncate text-muted-foreground">{row.component?.name ?? '—'}</p>
        </div>
      ),
      hideOnMobile: true,
      sortable: true,
      sortValue: (row) => row.route?.code ?? '',
    },
    {
      id: 'quantity',
      header: 'Cantidad',
      cell: (row) => <span className="font-mono text-sm">{row.quantity}</span>,
      hideOnMobile: true,
    },
    {
      id: 'area',
      header: 'Área',
      cell: (row) => <span className="text-xs">{AREA_BY_ID[row.areaId].shortName}</span>,
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (row) => <SparePartStatusBadge status={row.status} />,
      sortable: true,
      sortValue: (row) => row.status,
    },
    {
      id: 'requested',
      header: 'Solicitado',
      cell: (row) => <span className="text-xs text-muted-foreground">{formatDate(row.requestedAt)}</span>,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Taller y almacén"
        title="Repuestos"
        description="Solicitudes de materiales asociadas a las hojas de ruta activas."
        actions={
          <Button
            onClick={() => {
              setRouteId(candidateRoutes[0]?.id ?? '');
              setRouteSelectOpen(true);
            }}
          >
            <Plus /> Solicitar repuesto
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Pendientes" value={pending} hint="Esperan aprobación" icon={Package} tone="warning" />
        <KpiCard label="Aprobados" value={approved} hint="Listos para despacho" icon={CheckCircle2} tone="info" />
        <KpiCard label="Despachados" value={dispatched} hint="Entregados al taller" icon={Truck} tone="success" />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        search={{
          placeholder: 'Buscar por repuesto, código u hoja de ruta…',
          getText: (row) => `${row.name} ${row.code} ${row.route?.code ?? ''} ${row.component?.name ?? ''}`,
        }}
        actions={[
          {
            label: 'Aprobar',
            icon: CheckCircle2,
            hidden: (row) => !canDispatchSparePart(user) || row.status !== 'PENDING',
            onSelect: (row) => {
              updateSparePartStatus(row.id, 'APPROVED', user.id);
              toast.success(`${row.name} aprobado`);
            },
          },
          {
            label: 'Despachar',
            icon: Truck,
            hidden: (row) => !canDispatchSparePart(user) || row.status === 'DISPATCHED',
            onSelect: (row) => {
              updateSparePartStatus(row.id, 'DISPATCHED', user.id);
              toast.success(`${row.name} despachado`);
            },
          },
        ]}
        pageSize={10}
        emptyTitle="Sin repuestos"
        emptyDescription="Solicita materiales desde una hoja de ruta activa."
        caption="Solicitudes de repuestos"
      />

      <FormDialog
        open={routeSelectOpen}
        onOpenChange={setRouteSelectOpen}
        title="Seleccionar hoja de ruta"
        description="La solicitud quedará asociada al componente y su expediente."
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
                setSelectedRouteId(routeId);
                setRouteSelectOpen(false);
                setAddOpen(true);
              }}
            >
              Continuar
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

      <AddSparePartDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        parts={selectedParts}
        onSubmit={(input) => {
          if (!selectedRouteId) return;
          addSparePart(selectedRouteId, input, user.id);
          toast.success('Solicitud de repuesto enviada');
        }}
      />
    </div>
  );
}
