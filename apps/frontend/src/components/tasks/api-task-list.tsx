import { Check, Image as ImageIcon, Lock } from 'lucide-react';
import { TaskStatusBadge } from '@/components/common/badges';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import type { TaskRecord } from '@turbopre/shared';
import { formatDateTime } from '@/lib/formatters';

interface ApiTaskListProps {
  tasks: TaskRecord[];
  canComplete?: (task: TaskRecord) => boolean;
  onComplete?: (task: TaskRecord) => void;
  emptyMessage?: string;
}

function groupTasks(tasks: TaskRecord[]) {
  const stages = [...new Set(tasks.map((task) => task.stage))].sort((a, b) => a - b);
  const firstIncomplete = stages.find((stage) =>
    tasks.some((task) => task.stage === stage && task.status !== 'COMPLETED'),
  );

  return stages.map((stage) => {
    const stageTasks = tasks
      .filter((task) => task.stage === stage)
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
    const completed = stageTasks.every((task) => task.status === 'COMPLETED');

    return {
      stage,
      tasks: stageTasks,
      completed,
      active: !completed && stage === firstIncomplete,
    };
  });
}

export function ApiTaskList({
  tasks,
  canComplete,
  onComplete,
  emptyMessage = 'No hay tareas registradas.',
}: ApiTaskListProps) {
  const groups = groupTasks(tasks);

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.stage} className="overflow-hidden rounded-xl border border-border/70">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Etapa {group.stage}</p>
              <StatusBadge
                tone={group.completed ? 'success' : group.active ? 'accent' : 'neutral'}
                dot
              >
                {group.completed ? 'Completada' : group.active ? 'Activa' : 'Bloqueada'}
              </StatusBadge>
            </div>
            <p className="text-xs text-muted-foreground">
              {group.tasks.filter((task) => task.status === 'COMPLETED').length} de{' '}
              {group.tasks.length} tareas completadas
            </p>
          </div>

          <div className="divide-y divide-border/60">
            {group.tasks.map((task) => {
              const actionable = Boolean(canComplete?.(task));

              return (
                <div key={task.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_220px]">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {task.sequence !== null && (
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                          Paso {task.sequence}
                        </span>
                      )}
                      <StatusBadge tone="neutral" className="border">
                        {task.processName}
                      </StatusBadge>
                      <StatusBadge tone="neutral" className="border">
                        {task.jobPositionName}
                      </StatusBadge>
                      <TaskStatusBadge status={task.displayStatus} />
                      {task.source === 'INSPECTION' && (
                        <StatusBadge tone="info">Desde inspección</StatusBadge>
                      )}
                      {task.displayStatus === 'BLOCKED' && (
                        <Lock className="size-3.5 text-muted-foreground" />
                      )}
                    </div>

                    <p className="text-sm font-medium text-foreground">{task.description}</p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span>
                        Responsable:{' '}
                        <strong className="text-foreground">
                          {task.assignedToName ?? 'Cualquiera del puesto'}
                        </strong>
                      </span>
                      {task.criteria && <span>Criterio: {task.criteria}</span>}
                      {task.formRef && <span>Formulario: {task.formRef}</span>}
                      {task.completedAt && (
                        <span>Completada: {formatDateTime(task.completedAt)}</span>
                      )}
                    </div>

                    {task.notes && (
                      <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        {task.notes}
                      </p>
                    )}

                    {task.evidenceUrl && (
                      <div className="flex items-center gap-2">
                        <img
                          src={task.evidenceUrl}
                          alt={`Evidencia de ${task.description}`}
                          className="h-16 w-24 rounded-lg border border-border object-cover"
                        />
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <ImageIcon className="size-3.5" /> Evidencia registrada
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-stretch justify-between gap-2 lg:items-end">
                    {actionable && onComplete && (
                      <Button size="sm" onClick={() => onComplete(task)}>
                        <Check /> Marcar listo
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
