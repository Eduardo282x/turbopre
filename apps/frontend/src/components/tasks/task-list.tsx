import { Check, Image as ImageIcon, Lock } from 'lucide-react';
import { PositionBadge, ProcessBadge, TaskStatusBadge } from '@/components/common/badges';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getStageGroups } from '@/features/preview/store/selectors';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { Task } from '@/features/preview/types';
import { formatDateTime } from '@/lib/formatters';

interface TaskListProps {
  tasks: Task[];
  canComplete?: (task: Task) => boolean;
  onComplete?: (task: Task) => void;
  annexEditable?: boolean;
  onToggleAnnex?: (task: Task, selected: boolean) => void;
  emptyMessage?: string;
}

export function TaskList({
  tasks,
  canComplete,
  onComplete,
  annexEditable = false,
  onToggleAnnex,
  emptyMessage = 'No hay tareas registradas.',
}: TaskListProps) {
  const users = usePreviewStore((state) => state.db.users);
  const groups = getStageGroups(tasks);

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
              <StatusBadge tone={group.completed ? 'success' : group.active ? 'accent' : 'neutral'} dot>
                {group.completed ? 'Completada' : group.active ? 'Activa' : 'Bloqueada'}
              </StatusBadge>
            </div>
            <p className="text-xs text-muted-foreground">
              {group.tasks.filter((task) => task.status === 'COMPLETED').length} de {group.tasks.length} tareas completadas
            </p>
          </div>

          <div className="divide-y divide-border/60">
            {group.tasks.map((task) => {
              const assignee = users.find((user) => user.id === task.assignedUserId);
              const actionable = Boolean(canComplete?.(task));
              return (
                <div key={task.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_220px]">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                        Paso {task.step}
                      </span>
                      <ProcessBadge processId={task.processId} />
                      <PositionBadge positionId={task.positionId} />
                      <TaskStatusBadge status={task.status} />
                      {task.source === 'INSPECTION' && (
                        <StatusBadge tone="info">Desde inspección</StatusBadge>
                      )}
                      {task.status === 'BLOCKED' && <Lock className="size-3.5 text-muted-foreground" />}
                    </div>

                    <p className="text-sm font-medium text-foreground">{task.description}</p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span>
                        Responsable: <strong className="text-foreground">{assignee?.name ?? 'Cualquiera del puesto'}</strong>
                      </span>
                      {task.criteria && <span>Criterio: {task.criteria}</span>}
                      {task.forms && <span>Formulario: {task.forms}</span>}
                      {task.completedAt && <span>Completada: {formatDateTime(task.completedAt)}</span>}
                    </div>

                    {task.observations && (
                      <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        {task.observations}
                      </p>
                    )}

                    {task.evidence && (
                      <div className="flex items-center gap-2">
                        <img
                          src={task.evidence}
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
                    {annexEditable && task.evidence && (
                      <label className="flex items-center gap-2 rounded-lg border border-border/70 px-2.5 py-1.5 text-xs text-muted-foreground">
                        <Checkbox
                          checked={Boolean(task.annexSelected)}
                          onCheckedChange={(value) => onToggleAnnex?.(task, value === true)}
                        />
                        Incluir en anexos
                      </label>
                    )}
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
