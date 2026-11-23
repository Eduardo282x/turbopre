import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { CreateTaskInput, OrganizationCatalog, UserOption } from '@turbopre/shared';
import { catalogsService } from '@/services/catalogs/catalogs.service';
import { usersService } from '@/services/users/users.service';

interface ApiTaskBuilderProps {
  tasks: CreateTaskInput[];
  onChange: (tasks: CreateTaskInput[]) => void;
  defaultStage?: number;
  compact?: boolean;
}

export function createEmptyApiTask(
  catalog: OrganizationCatalog | undefined,
  stage = 1,
): CreateTaskInput {
  const firstPosition = catalog?.jobPositions[0];

  return {
    stage,
    jobPositionId: firstPosition?.id ?? '',
    assignedToId: null,
    description: '',
    criteria: '',
    formRef: '',
    requiresEvidence: true,
  };
}

export function ApiTaskBuilder({
  tasks,
  onChange,
  defaultStage = 1,
  compact = false,
}: ApiTaskBuilderProps) {
  const catalogsQuery = useQuery({
    queryKey: ['catalogs', 'organization'],
    queryFn: () => catalogsService.getOrganization(),
    staleTime: 5 * 60_000,
  });
  const usersQuery = useQuery({
    queryKey: ['users', 'options', 'tasks'],
    queryFn: () => usersService.options(['OPERATOR', 'ENGINEER', 'QUALITY']),
    staleTime: 5 * 60_000,
  });

  const positions = catalogsQuery.data?.jobPositions ?? [];
  const users = usersQuery.data ?? [];

  const update = (index: number, patch: Partial<CreateTaskInput>) => {
    onChange(
      tasks.map((task, current) => (current === index ? { ...task, ...patch } : task)),
    );
  };

  const add = () => {
    onChange([...tasks, createEmptyApiTask(catalogsQuery.data, defaultStage)]);
  };

  const remove = (index: number) => {
    onChange(tasks.filter((_, current) => current !== index));
  };

  const candidatesFor = (jobPositionId: string): UserOption[] =>
    users.filter((user) => user.jobPositionId === jobPositionId);

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

      {catalogsQuery.isLoading && (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Cargando puestos de trabajo…
        </p>
      )}

      {tasks.length === 0 && !catalogsQuery.isLoading && (
        <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Todavía no hay tareas. Agrega la primera.
        </div>
      )}

      <div className="space-y-3">
        {tasks.map((task, index) => {
          const candidates = candidatesFor(task.jobPositionId);
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
                      update(index, {
                        stage: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                  />
                </Field>
                <Field className="xl:col-span-2">
                  <FieldLabel>Puesto de trabajo</FieldLabel>
                  <Select
                    value={task.jobPositionId}
                    onValueChange={(value) =>
                      update(index, { jobPositionId: value, assignedToId: null })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un puesto" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.processName} · {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Usuario (opcional)</FieldLabel>
                  <Select
                    value={task.assignedToId ?? 'any'}
                    onValueChange={(value) =>
                      update(index, {
                        assignedToId: value === 'any' ? null : value,
                      })
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
                    onChange={(event) =>
                      update(index, { description: event.target.value })
                    }
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
                    value={task.formRef ?? ''}
                    onChange={(event) => update(index, { formRef: event.target.value })}
                    placeholder="FO-ING-110"
                  />
                </Field>
              </div>

              <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={task.requiresEvidence}
                  onCheckedChange={(value) =>
                    update(index, { requiresEvidence: value === true })
                  }
                />
                Exigir evidencia fotográfica para completar
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
