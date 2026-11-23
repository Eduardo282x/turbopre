import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  POSITIONS,
  PROCESSES,
  getPositionsForProcess,
} from '@/features/preview/config';
import type { NewTaskInput, PositionId, ProcessId } from '@/features/preview/types';
import { usePreviewStore } from '@/features/preview/store/preview-store';

interface TaskBuilderProps {
  tasks: NewTaskInput[];
  onChange: (tasks: NewTaskInput[]) => void;
  defaultStage?: number;
  defaultProcessId?: ProcessId;
  compact?: boolean;
}

function firstPosition(processId: ProcessId): PositionId {
  return getPositionsForProcess(processId)[0]?.id ?? POSITIONS[0].id;
}

export function createEmptyTask(processId: ProcessId = 'rotating', stage = 1): NewTaskInput {
  return {
    stage,
    processId,
    positionId: firstPosition(processId),
    description: '',
    criteria: '',
    forms: '',
  };
}

export function TaskBuilder({
  tasks,
  onChange,
  defaultStage = 1,
  defaultProcessId = 'rotating',
  compact = false,
}: TaskBuilderProps) {
  const users = usePreviewStore((state) => state.db.users);

  const update = (index: number, patch: Partial<NewTaskInput>) => {
    onChange(tasks.map((task, current) => (current === index ? { ...task, ...patch } : task)));
  };

  const add = () => {
    onChange([...tasks, createEmptyTask(defaultProcessId, defaultStage)]);
  };

  const remove = (index: number) => {
    onChange(tasks.filter((_, current) => current !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Tareas por puesto y etapa</p>
          <p className="text-xs text-muted-foreground">
            Las tareas de una etapa se ejecutan en paralelo. La siguiente se desbloquea al completar la anterior.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus /> Agregar tarea
        </Button>
      </div>

      {tasks.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Todavía no hay tareas. Agrega la primera.
        </div>
      )}

      <div className="space-y-3">
        {tasks.map((task, index) => {
          const positions = getPositionsForProcess(task.processId);
          const candidates = users.filter(
            (user) => user.active && user.positionId === task.positionId,
          );
          return (
            <div key={index} className="rounded-xl border border-border/70 bg-muted/10 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Tarea {index + 1}</Badge>
                  <Badge variant="outline">Etapa {task.stage}</Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(index)}
                  aria-label={`Eliminar tarea ${index + 1}`}
                >
                  <Trash2 />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Field>
                  <FieldLabel>Etapa</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    value={task.stage}
                    onChange={(event) =>
                      update(index, { stage: Math.max(1, Number(event.target.value) || 1) })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Proceso</FieldLabel>
                  <Select
                    value={task.processId}
                    onValueChange={(value) => {
                      const processId = value as ProcessId;
                      update(index, {
                        processId,
                        positionId: firstPosition(processId),
                        assignedUserId: undefined,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROCESSES.map((process) => (
                        <SelectItem key={process.id} value={process.id}>
                          {process.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Puesto de trabajo</FieldLabel>
                  <Select
                    value={task.positionId}
                    onValueChange={(value) =>
                      update(index, { positionId: value as PositionId, assignedUserId: undefined })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Usuario (opcional)</FieldLabel>
                  <Select
                    value={task.assignedUserId ?? 'any'}
                    onValueChange={(value) =>
                      update(index, { assignedUserId: value === 'any' ? undefined : value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Cualquiera del puesto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Cualquiera del puesto</SelectItem>
                      {candidates.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr_1fr]">
                <Field>
                  <FieldLabel>Descripción de la actividad</FieldLabel>
                  <Textarea
                    rows={compact ? 2 : 3}
                    value={task.description}
                    onChange={(event) => update(index, { description: event.target.value })}
                    placeholder="Ej: Revisar fisura de la biela y registrar hallazgos."
                  />
                </Field>
                <Field>
                  <FieldLabel>Criterio / procedimiento</FieldLabel>
                  <Input
                    value={task.criteria ?? ''}
                    onChange={(event) => update(index, { criteria: event.target.value })}
                    placeholder="PR-TUR-100"
                  />
                </Field>
                <Field>
                  <FieldLabel>Formulario</FieldLabel>
                  <Input
                    value={task.forms ?? ''}
                    onChange={(event) => update(index, { forms: event.target.value })}
                    placeholder="FO-ING-110"
                  />
                </Field>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
