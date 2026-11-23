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
  InspectionStatusBadge,
  RouteStatusBadge,
} from '@/components/common/badges';
import { EmptyState } from '@/components/common/empty-state';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { ApiCompleteTaskDialog } from '@/components/tasks/api-complete-task-dialog';
import { ApiTaskList } from '@/components/tasks/api-task-list';
import { CompleteTaskDialog } from '@/components/tasks/complete-task-dialog';
import { TaskList } from '@/components/tasks/task-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  getMyTasks,
  getProgress,
  getRouteSheetsWithRelations,
  isTaskMine,
} from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { useInspections, useMyTasks } from '@/hooks/use-inspections';
import type { InspectionRecord, TaskRecord } from '@turbopre/shared';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/formatters';
import { canCompleteTask as canCompletePreviewTask } from '@/lib/permissions';
import { canCompleteTask as canCompleteApiTask } from '@turbopre/shared';
import { useAuthStore } from '@/stores/use-auth-store';
import { tasksService } from '@/services/tasks/tasks.service';
import type { Task, TaskWithContext } from '@/features/preview/types';

interface RouteGroup {
  key: string;
  route: ReturnType<typeof getRouteSheetsWithRelations>[number];
  tasks: Task[];
}

export function MyTasksPage() {
  const user = useCurrentUser();
  const authUser = useAuthStore((state) => state.user);
  const db = usePreviewStore((state) => state.db);
  const queryClient = useQueryClient();
  const completePreviewTask = usePreviewStore((state) => state.completeTask);
  const apiTasksQuery = useMyTasks();
  const inspectionsQuery = useInspections();
  const [previewContext, setPreviewContext] = useState<TaskWithContext | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [apiTask, setApiTask] = useState<TaskRecord | null>(null);
  const [apiOpen, setApiOpen] = useState(false);

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

  const previewRouteTasks = useMemo(
    () => (user ? getMyTasks(db, user).filter((item) => item.routeSheet) : []),
    [db, user],
  );
  const routeGroups = useMemo(() => {
    const map = new Map<string, RouteGroup>();

    previewRouteTasks.forEach((item) => {
      if (!item.routeSheet) return;
      const key = `route-${item.routeSheet.id}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          route: item.routeSheet,
          tasks: item.routeSheet.tasks,
        });
      }
    });

    return [...map.values()];
  }, [previewRouteTasks]);

  const completeApiMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: Parameters<typeof tasksService.complete>[1] }) =>
      tasksService.complete(taskId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['inspections'] });
      void queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Tarea marcada como lista. La etapa siguiente se desbloqueó.');
      setApiOpen(false);
      setApiTask(null);
    },
    onError: (error) =>
      toast.error('No se pudo completar la tarea', {
        description: getApiErrorMessage(error),
      }),
  });

  if (!user || !authUser) return null;

  const completedRoutes = getRouteSheetsWithRelations(db).filter(
    (route) =>
      route.progress === 100 &&
      route.tasks.some((task) => isTaskMine(task, user)) &&
      !routeGroups.some((group) => group.key === `route-${route.id}`),
  );

  const pending =
    apiTasks.filter((context) => context.task.displayStatus === 'PENDING').length +
    previewRouteTasks.filter((item) => item.task.status === 'PENDING').length;
  const inProgress =
    apiTasks.filter((context) => context.task.displayStatus === 'IN_PROGRESS').length +
    previewRouteTasks.filter((item) => item.task.status === 'IN_PROGRESS').length;
  const blocked =
    apiTasks.filter((context) => context.task.displayStatus === 'BLOCKED').length +
    previewRouteTasks.filter((item) => item.task.status === 'BLOCKED').length;
  const totalTasks = apiTasks.length + previewRouteTasks.length;
  const isLoadingTasks = apiTasksQuery.isLoading || inspectionsQuery.isLoading;

  const openApiComplete = (task: TaskRecord) => {
    setApiTask(task);
    setApiOpen(true);
  };

  const openPreviewComplete = (task: Task) => {
    const item = previewRouteTasks.find(
      (candidate) => candidate.task.id === task.id,
    );
    if (!item) return;
    setPreviewContext(item);
    setPreviewOpen(true);
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
          canComplete={(task) => canCompleteApiTask(authUser, task)}
          onComplete={openApiComplete}
        />
      </CardContent>
    </Card>
  );

  const renderRouteGroup = (group: RouteGroup) => {
    const progress = getProgress(group.tasks);
    return (
      <Card key={group.key} className="border-border/80 bg-card/80 py-0">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading text-base font-semibold text-foreground">
                  {group.route.code}
                </p>
                <RouteStatusBadge status={group.route.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {group.route.client?.name ?? 'Sin cliente'} ·{' '}
                {group.route.asset?.manufacturer} {group.route.asset?.model}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Entrega: {formatDate(group.route.dueDate)}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/hojas-de-ruta/${group.route.id}`}>
                Abrir hoja completa <ArrowRight />
              </Link>
            </Button>
          </div>

          <ProgressBar
            value={progress.progress}
            label={`${progress.completed} de ${progress.total} tareas completadas`}
          />

          <TaskList
            tasks={group.tasks}
            canComplete={(task) => canCompletePreviewTask(user, task)}
            onComplete={openPreviewComplete}
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
          user.role === 'ENGINEER' || user.role === 'QUALITY' ? (
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

      {isLoadingTasks && totalTasks === 0 && completedRoutes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Cargando tareas…
        </p>
      ) : totalTasks === 0 && completedRoutes.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="¡Todo al día!"
          description="No tienes tareas pendientes en este momento."
        />
      ) : (
        <div className="space-y-8">
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

          {completedRoutes.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success" />
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Hojas completadas donde participé
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {completedRoutes.map((route) => (
                  <div key={route.id} className="rounded-xl border border-border/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{route.code}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {route.client?.name} · {route.asset?.model}
                        </p>
                      </div>
                      <RouteStatusBadge status={route.status} />
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {route.completedTasks} tareas ·{' '}
                      {route.qualityApprovedAt
                        ? 'Calidad aprobada'
                        : 'Pendiente de calidad'}
                    </p>
                    <Button variant="outline" size="sm" asChild className="mt-3 w-full">
                      <Link to={`/hojas-de-ruta/${route.id}`}>
                        Ver hoja completa <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <ApiCompleteTaskDialog
        open={apiOpen}
        onOpenChange={setApiOpen}
        task={apiTask}
        inspection={
          apiTask?.inspectionId
            ? inspectionsById.get(apiTask.inspectionId) ?? null
            : null
        }
        pending={completeApiMutation.isPending}
        onSubmit={(payload) => {
          if (!apiTask) return;
          completeApiMutation.mutate({ taskId: apiTask.id, payload });
        }}
      />

      <CompleteTaskDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        context={previewContext}
        onSubmit={(payload) => {
          if (!previewContext) return;
          completePreviewTask(previewContext.task.id, user.id, payload);
          toast.success('Tarea marcada como lista. La etapa siguiente se desbloqueó.');
        }}
      />
    </div>
  );
}
