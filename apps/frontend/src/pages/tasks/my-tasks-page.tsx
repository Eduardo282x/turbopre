import { ArrowRight, CheckCircle2, ClipboardCheck, ClipboardList, Lock, Play, Timer } from 'lucide-react';
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
import type { Task, TaskWithContext } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';
import { canCompleteTask } from '@/lib/permissions';

interface Group {
  key: string;
  kind: 'route' | 'inspection';
  title: string;
  subtitle: string;
  href: string;
  status: string;
  tasks: Task[];
  dueDate?: string;
}

export function MyTasksPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const completeTask = usePreviewStore((state) => state.completeTask);
  const [context, setContext] = useState<TaskWithContext | null>(null);
  const [open, setOpen] = useState(false);

  const myTasks = useMemo(() => (user ? getMyTasks(db, user) : []), [db, user]);
  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    myTasks.forEach((item) => {
      if (item.routeSheet) {
        const key = `route-${item.routeSheet.id}`;
        if (!map.has(key)) {
          map.set(key, {
            key,
            kind: 'route',
            title: item.routeSheet.code,
            subtitle: `${item.client?.name ?? 'Sin cliente'} · ${item.asset?.manufacturer} ${item.asset?.model}`,
            href: `/hojas-de-ruta/${item.routeSheet.id}`,
            status: item.routeSheet.status,
            tasks: item.routeSheet.tasks,
            dueDate: item.routeSheet.dueDate,
          });
        }
      } else if (item.inspection) {
        const key = `inspection-${item.inspection.id}`;
        if (!map.has(key)) {
          map.set(key, {
            key,
            kind: 'inspection',
            title: item.inspection.code,
            subtitle: `${item.client?.name ?? 'Sin cliente'} · ${item.asset?.manufacturer} ${item.asset?.model}`,
            href: `/taller/inspecciones/${item.inspection.id}`,
            status: item.inspection.status,
            tasks: item.inspection.tasks,
          });
        }
      }
    });
    return [...map.values()];
  }, [myTasks]);

  if (!user) return null;

  const routeGroups = groups.filter((group) => group.kind === 'route');
  const inspectionGroups = groups.filter((group) => group.kind === 'inspection');
  const completedRoutes = getRouteSheetsWithRelations(db).filter(
    (route) =>
      route.progress === 100 &&
      route.tasks.some((task) => isTaskMine(task, user)) &&
      !groups.some((group) => group.key === `route-${route.id}`),
  );
  const pending = myTasks.filter((item) => item.task.status === 'PENDING').length;
  const inProgress = myTasks.filter((item) => item.task.status === 'IN_PROGRESS').length;
  const blocked = myTasks.filter((item) => item.task.status === 'BLOCKED').length;

  const openComplete = (task: Task) => {
    const item = myTasks.find((candidate) => candidate.task.id === task.id);
    if (!item) return;
    setContext(item);
    setOpen(true);
  };

  const renderGroup = (group: Group) => {
    const progress = getProgress(group.tasks);
    return (
      <Card key={group.key} className="border-border/80 bg-card/80 py-0">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading text-base font-semibold text-foreground">{group.title}</p>
                {group.kind === 'route' ? (
                  <RouteStatusBadge status={group.status as never} />
                ) : (
                  <InspectionStatusBadge status={group.status as never} />
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{group.subtitle}</p>
              {group.dueDate && (
                <p className="mt-1 text-[11px] text-muted-foreground">Entrega: {formatDate(group.dueDate)}</p>
              )}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={group.href}>
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
            canComplete={(task) => canCompleteTask(user, task)}
            onComplete={openComplete}
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
          user.role === 'ENGINEERING' || user.role === 'QUALITY' ? (
            <Button variant="outline" asChild>
              <Link to="/hojas-de-ruta">
                <ClipboardList /> Ver hojas de ruta
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Pendientes" value={pending} hint="Listas para comenzar" icon={Timer} tone="warning" />
        <KpiCard label="En proceso" value={inProgress} hint="Tareas activas" icon={Play} tone="accent" />
        <KpiCard label="Bloqueadas" value={blocked} hint="Esperan la etapa anterior" icon={Lock} tone="danger" />
      </div>

      {myTasks.length === 0 && completedRoutes.length === 0 ? (
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
              {routeGroups.map(renderGroup)}
            </section>
          )}

          {inspectionGroups.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="size-4 text-info" />
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Inspecciones
                </h2>
              </div>
              {inspectionGroups.map(renderGroup)}
            </section>
          )}

          {myTasks.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No tienes tareas pendientes. Abajo puedes revisar las hojas completadas donde participaste.
            </p>
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
                      {route.completedTasks} tareas · {route.qualityApprovedAt ? 'Calidad aprobada' : 'Pendiente de calidad'}
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

      <CompleteTaskDialog
        open={open}
        onOpenChange={setOpen}
        context={context}
        onSubmit={(payload) => {
          if (!context) return;
          completeTask(context.task.id, user.id, payload);
          toast.success('Tarea marcada como lista. La etapa siguiente se desbloqueó.');
        }}
      />
    </div>
  );
}
