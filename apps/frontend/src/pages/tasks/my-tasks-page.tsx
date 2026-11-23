import type {
  InspectionRecord,
  RouteSheetRecord,
  TaskContext,
  TaskRecord,
} from '@turbopre/shared';
import { canCompleteTask } from '@turbopre/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Lock,
  Play,
  Timer,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import {
  ApiRouteStatusBadge,
  InspectionStatusBadge,
} from '@/components/common/badges';
import { EmptyState } from '@/components/common/empty-state';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { ApiCompleteTaskDialog } from '@/components/tasks/api-complete-task-dialog';
import { ApiTaskList } from '@/components/tasks/api-task-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useInspections, useMyTasks } from '@/hooks/use-inspections';
import { useRouteSheets } from '@/hooks/use-route-sheets';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/formatters';
import { tasksService } from '@/services/tasks/tasks.service';
import { useAuthStore } from '@/stores/use-auth-store';

interface RouteGroup {
  route: RouteSheetRecord;
  contexts: TaskContext[];
}

const ACTIVE_ROUTE_STATUSES = ['RELEASED', 'IN_PROGRESS'];

export function MyTasksPage() {
  const authUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const apiTasksQuery = useMyTasks();
  const inspectionsQuery = useInspections();
  const routesQuery = useRouteSheets();
  const [apiTask, setApiTask] = useState<TaskRecord | null>(null);
  const [apiOpen, setApiOpen] = useState(false);
  const [completeRoute, setCompleteRoute] = useState<RouteSheetRecord | null>(null);

  const apiTasks = useMemo(() => apiTasksQuery.data ?? [], [apiTasksQuery.data]);
  const apiInspectionIds = useMemo(
    () =>
      [
        ...new Set(
          apiTasks
            .map((context) => context.inspection?.id)
            .filter((id): id is string => Boolean(id)),
        ),
      ],
    [apiTasks],
  );
  const inspectionsById = useMemo(
    () =>
      new Map(
        (inspectionsQuery.data ?? []).map((inspection) => [inspection.id, inspection]),
      ),
    [inspectionsQuery.data],
  );
  const apiInspections = useMemo(
    () =>
      apiInspectionIds
        .map((id) => inspectionsById.get(id))
        .filter((inspection): inspection is InspectionRecord => Boolean(inspection)),
    [apiInspectionIds, inspectionsById],
  );

  const routesById = useMemo(
    () => new Map((routesQuery.data ?? []).map((route) => [route.id, route])),
    [routesQuery.data],
  );

  const routeGroups = useMemo(() => {
    const groups = new Map<string, RouteGroup>();

    apiTasks.forEach((context) => {
      if (!context.routeSheet) return;
      const route = routesById.get(context.routeSheet.id);
      if (!route) return;

      const current = groups.get(route.id);
      if (current) {
        current.contexts.push(context);
      } else {
        groups.set(route.id, { route, contexts: [context] });
      }
    });

    return [...groups.values()];
  }, [apiTasks, routesById]);

  const completeApiMutation = useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: Parameters<typeof tasksService.complete>[1];
    }) => tasksService.complete(taskId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['inspections'] });
      void queryClient.invalidateQueries({ queryKey: ['route-sheets'] });
      void queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Tarea marcada como lista. La etapa siguiente se desbloqueó.');
      setApiOpen(false);
      setApiTask(null);
      setCompleteRoute(null);
    },
    onError: (error) =>
      toast.error('No se pudo completar la tarea', {
        description: getApiErrorMessage(error),
      }),
  });

  if (!authUser) return null;

  const pending = apiTasks.filter(
    (context) => context.task.displayStatus === 'PENDING',
  ).length;
  const inProgress = apiTasks.filter(
    (context) => context.task.displayStatus === 'IN_PROGRESS',
  ).length;
  const blocked = apiTasks.filter(
    (context) => context.task.displayStatus === 'BLOCKED',
  ).length;
  const totalTasks = apiTasks.length;
  const isLoadingTasks =
    apiTasksQuery.isLoading || inspectionsQuery.isLoading || routesQuery.isLoading;

  const openApiComplete = (task: TaskRecord, route?: RouteSheetRecord) => {
    setApiTask(task);
    setCompleteRoute(route ?? null);
    setApiOpen(true);
  };

  const renderInspectionGroup = (inspection: InspectionRecord) => (
    <Card key={inspection.id} className="border-border/80 bg-card/80 py-0">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-heading text-base font-semibold text-foreground">
                {inspection.code}
              </p>
              <InspectionStatusBadge status={inspection.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {inspection.serviceOrder.clientName} ·{' '}
              {inspection.serviceOrder.equipmentName}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              ODS {inspection.serviceOrder.orderNumber}
              {inspection.serviceOrder.dueAt
                ? ` · Entrega: ${formatDate(inspection.serviceOrder.dueAt)}`
                : ''}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/taller/inspecciones/${inspection.id}`}>
              Abrir inspección <ArrowRight />
            </Link>
          </Button>
        </div>

        <ProgressBar
          value={inspection.progress}
          label={`${inspection.completedTasks} de ${inspection.totalTasks} tareas completadas`}
        />

        <ApiTaskList
          tasks={inspection.tasks}
          canComplete={(task) => canCompleteTask(authUser, task)}
          onComplete={(task) => openApiComplete(task)}
        />
      </CardContent>
    </Card>
  );

  const renderRouteGroup = (group: RouteGroup) => {
    const { route } = group;
    const canExecute = ACTIVE_ROUTE_STATUSES.includes(route.status);

    return (
      <Card key={route.id} className="border-border/80 bg-card/80 py-0">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading text-base font-semibold text-foreground">
                  {route.code}
                </p>
                <ApiRouteStatusBadge status={route.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {route.serviceOrder.clientName} · {route.serviceOrder.equipmentName}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                ODS {route.serviceOrder.orderNumber}
                {route.serviceOrder.dueAt
                  ? ` · Entrega: ${formatDate(route.serviceOrder.dueAt)}`
                  : ''}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/hojas-de-ruta/${route.id}`}>
                Abrir hoja completa <ArrowRight />
              </Link>
            </Button>
          </div>

          <ProgressBar
            value={route.progress}
            label={`${route.completedTasks} de ${route.totalTasks} tareas completadas`}
          />

          <ApiTaskList
            tasks={route.tasks}
            canComplete={(task) =>
              canExecute && canCompleteTask(authUser, task)
            }
            onComplete={(task) => openApiComplete(task, route)}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ejecución"
        title="Mis tareas"
        description="Se muestra la hoja completa. Solo tus tareas de la etapa activa tienen el botón para marcar listo."
        actions={
          authUser.role === 'ENGINEER' || authUser.role === 'QUALITY' ? (
            <Button variant="outline" asChild>
              <Link to="/hojas-de-ruta">
                <ClipboardList /> Ver hojas de ruta
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Pendientes"
          value={pending}
          hint="Listas para comenzar"
          icon={Timer}
          tone="warning"
        />
        <KpiCard
          label="En proceso"
          value={inProgress}
          hint="Tareas activas"
          icon={Play}
          tone="accent"
        />
        <KpiCard
          label="Bloqueadas"
          value={blocked}
          hint="Esperan la etapa anterior"
          icon={Lock}
          tone="danger"
        />
      </div>

      {isLoadingTasks && totalTasks === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Cargando tareas…
        </p>
      ) : totalTasks === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="¡Todo al día!"
          description="No tienes tareas pendientes en este momento."
        />
      ) : (
        <div className="space-y-8">
          {routeGroups.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4 text-primary" />
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Hojas de ruta activas
                </h2>
              </div>
              {routeGroups.map(renderRouteGroup)}
            </section>
          )}

          {apiInspections.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="size-4 text-info" />
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Inspecciones
                </h2>
              </div>
              {apiInspections.map(renderInspectionGroup)}
            </section>
          )}
        </div>
      )}

      <ApiCompleteTaskDialog
        open={apiOpen}
        onOpenChange={(open) => {
          setApiOpen(open);
          if (!open) setCompleteRoute(null);
        }}
        task={apiTask}
        inspection={
          apiTask?.inspectionId
            ? inspectionsById.get(apiTask.inspectionId) ?? null
            : null
        }
        routeSheet={completeRoute}
        pending={completeApiMutation.isPending}
        onSubmit={(payload) => {
          if (!apiTask) return;
          completeApiMutation.mutate({ taskId: apiTask.id, payload });
        }}
      />
    </div>
  );
}
