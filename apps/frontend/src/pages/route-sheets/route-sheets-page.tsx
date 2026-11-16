import { Eye, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { PriorityBadge, RouteStatusBadge } from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
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
import { PRIORITY_META, ROUTE_STATUS_META, ROUTE_STATUS_ORDER } from '@/features/preview/config';
import { getRoutesWithRelations } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { NewRouteSheetInput, RouteSheet, RouteSheetWithRelations } from '@/features/preview/types';
import { daysUntil, formatDate } from '@/lib/formatters';
import { canEditRoute, canManageRoutes, canSendToReview } from '@/lib/permissions';
import { RouteSheetFormDialog } from './route-sheet-form-dialog';

export function RouteSheetsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const createRouteSheet = usePreviewStore((state) => state.createRouteSheet);
  const updateRouteSheet = usePreviewStore((state) => state.updateRouteSheet);
  const deleteRouteSheet = usePreviewStore((state) => state.deleteRouteSheet);
  const sendToReview = usePreviewStore((state) => state.sendToReview);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(() => searchParams.get('nueva') === '1');
  const [editing, setEditing] = useState<RouteSheet | undefined>();
  const [editingOpen, setEditingOpen] = useState(false);
  const [deleting, setDeleting] = useState<RouteSheet | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const routes = getRoutesWithRelations(db);

  const filtered = useMemo(
    () =>
      routes.filter((route) => {
        const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || route.priority === priorityFilter;
        return matchesStatus && matchesPriority;
      }),
    [priorityFilter, routes, statusFilter],
  );

  if (!user) return null;

  const handleCreate = (input: NewRouteSheetInput) => {
    const id = createRouteSheet(input, user.id);
    toast.success('Hoja de ruta creada', {
      description: 'Agrega partes, fases y repuestos desde el detalle.',
    });
    navigate(`/hojas-de-ruta/${id}`);
  };

  const handleEdit = (input: NewRouteSheetInput) => {
    if (!editing) return;
    updateRouteSheet(editing.id, input, user.id);
    toast.success('Hoja de ruta actualizada');
    setEditing(undefined);
  };

  const columns: DataTableColumn<RouteSheetWithRelations>[] = [
    {
      id: 'code',
      header: 'Hoja de ruta',
      cell: (route) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{route.code}</p>
          <p className="max-w-64 truncate text-xs text-muted-foreground">{route.component.name}</p>
          <p className="text-[11px] text-muted-foreground/70">Serial: {route.component.serial}</p>
        </div>
      ),
      sortable: true,
      sortValue: (route) => route.code,
    },
    {
      id: 'client',
      header: 'Cliente',
      cell: (route) => <span className="text-sm">{route.client?.name ?? '—'}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) => route.client?.name ?? '',
    },
    {
      id: 'structure',
      header: 'Estructura',
      cell: (route) => (
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="text-foreground">{route.parts.length} partes</span>
          <span className="text-muted-foreground">{route.totalPhases} fases</span>
        </div>
      ),
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) => route.parts.length,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: (route) => <ProgressBar value={route.progress} className="w-28" />,
      hideOnMobile: true,
    },
    {
      id: 'priority',
      header: 'Prioridad',
      cell: (route) => <PriorityBadge priority={route.priority} />,
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) => route.priority,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (route) => <RouteStatusBadge status={route.status} />,
      sortable: true,
      sortValue: (route) => route.status,
    },
    {
      id: 'due',
      header: 'Entrega',
      cell: (route) => {
        const days = daysUntil(route.dueDate);
        return (
          <div className="text-xs">
            <p className="text-foreground">{formatDate(route.dueDate)}</p>
            <p className={days < 0 ? 'text-destructive' : days <= 3 ? 'text-warning' : 'text-muted-foreground'}>
              {days < 0 ? `${Math.abs(days)} días de retraso` : `En ${days} días`}
            </p>
          </div>
        );
      },
      hideOnMobile: true,
      sortable: true,
      sortValue: (route) => new Date(route.dueDate),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planificación y seguimiento"
        title="Hojas de ruta"
        description="Cada hoja de ruta define el componente, sus partes, los repuestos y la secuencia de fases por área."
        actions={
          canManageRoutes(user) ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Nueva hoja de ruta
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={filtered}
        columns={columns}
        getRowId={(route) => route.id}
        search={{
          placeholder: 'Buscar por código, componente, cliente o serial…',
          getText: (route) =>
            [route.code, route.component.name, route.component.serial, route.client?.name, route.description]
              .filter(Boolean)
              .join(' '),
        }}
        filters={
          <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger size="sm" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {ROUTE_STATUS_ORDER.map((status) => (
                  <SelectItem key={status} value={status}>
                    {ROUTE_STATUS_META[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda prioridad</SelectItem>
                {Object.entries(PRIORITY_META).map(([priority, meta]) => (
                  <SelectItem key={priority} value={priority}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        actions={[
          { label: 'Ver detalle', icon: Eye, onSelect: (route) => navigate(`/hojas-de-ruta/${route.id}`) },
          {
            label: 'Editar',
            icon: Pencil,
            hidden: (route) => !canEditRoute(user, route),
            onSelect: (route) => {
              setEditing(route);
              setEditingOpen(true);
            },
          },
          {
            label: 'Enviar a revisión',
            icon: Send,
            hidden: (route) => !canSendToReview(user, route),
            onSelect: (route) => {
              if (route.parts.length === 0) {
                toast.error('Agrega al menos una parte antes de enviar a revisión');
                return;
              }
              sendToReview(route.id, user.id);
              toast.success(`${route.code} enviada a revisión de Ingeniería`);
            },
          },
          {
            label: 'Eliminar',
            icon: Trash2,
            variant: 'destructive',
            hidden: (route) => !canManageRoutes(user) || route.status !== 'DRAFT',
            onSelect: (route) => setDeleting(route),
          },
        ]}
        onRowClick={(route) => navigate(`/hojas-de-ruta/${route.id}`)}
        pageSize={10}
        emptyTitle="No hay hojas de ruta"
        emptyDescription="Crea la primera hoja de ruta o ajusta los filtros de búsqueda."
        caption="Listado de hojas de ruta"
      />

      <RouteSheetFormDialog key={`create-${createOpen}`} open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />
      <RouteSheetFormDialog
        key={`edit-${editing?.id ?? 'none'}-${editingOpen}`}
        open={editingOpen}
        onOpenChange={(open) => {
          setEditingOpen(open);
          if (!open) setEditing(undefined);
        }}
        route={editing}
        onSubmit={handleEdit}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
        title="Eliminar hoja de ruta"
        description={`Se eliminarán también las partes, fases y repuestos de ${deleting?.code ?? 'la hoja'}. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={() => {
          if (!deleting) return;
          deleteRouteSheet(deleting.id, user.id);
          toast.info(`${deleting.code} eliminada`);
          setDeleting(undefined);
        }}
      />
    </div>
  );
}
