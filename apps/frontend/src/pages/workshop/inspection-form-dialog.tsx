import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FormDialog } from '@/components/common/form-dialog';
import { ApiTaskBuilder, createEmptyApiTask } from '@/components/tasks/api-task-builder';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useServiceOrders } from '@/hooks/use-commercial-data';
import type {
  CreateInspectionInput,
  CreateTaskInput,
  EquipmentType,
  OrganizationCatalog,
} from '@turbopre/shared';
import { catalogsService } from '@/services/catalogs/catalogs.service';

interface InspectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultOrderId?: string;
  pending?: boolean;
  onSubmit: (input: CreateInspectionInput) => void;
}

function primaryPositionCode(type?: EquipmentType): string {
  if (type === 'GENERATOR') return 'WINDER_I';
  if (type === 'AUXILIARY') return 'MACHINE_OPERATOR_I';
  return 'ROTATING_SPECIALIST';
}

function findPositionId(catalog: OrganizationCatalog, code: string): string | undefined {
  return catalog.jobPositions.find((position) => position.code === code)?.id;
}

function initialTasks(
  catalog: OrganizationCatalog | undefined,
  type?: EquipmentType,
): CreateTaskInput[] {
  if (!catalog) return [];

  const primaryId =
    findPositionId(catalog, primaryPositionCode(type)) ??
    catalog.jobPositions[0]?.id;
  const qualityId =
    findPositionId(catalog, 'QUALITY_INSPECTOR') ??
    catalog.jobPositions.find((position) => position.processKind === 'QUALITY')?.id;

  if (!primaryId || !qualityId) {
    return [createEmptyApiTask(catalog, 1)];
  }

  return [
    {
      stage: 1,
      jobPositionId: primaryId,
      assignedToId: null,
      description: 'Inspección visual y dimensional del equipo.',
      criteria: 'PR-TUR-100',
      formRef: 'FO-ING-110',
      requiresEvidence: true,
    },
    {
      stage: 1,
      jobPositionId: qualityId,
      assignedToId: null,
      description: 'Inspección de limpieza y registro fotográfico.',
      criteria: 'PR-CAL-109',
      formRef: 'FO-ING-155',
      requiresEvidence: true,
    },
  ];
}

export function InspectionFormDialog({
  open,
  onOpenChange,
  defaultOrderId,
  pending = false,
  onSubmit,
}: InspectionFormDialogProps) {
  const ordersQuery = useServiceOrders();
  const catalogsQuery = useQuery({
    queryKey: ['catalogs', 'organization'],
    queryFn: () => catalogsService.getOrganization(),
    staleTime: 5 * 60_000,
  });

  const [serviceOrderId, setServiceOrderId] = useState('');
  const [findings, setFindings] = useState('');
  const [tasks, setTasks] = useState<CreateTaskInput[]>([]);
  const tasksInitialized = useRef(false);

  const orders = ordersQuery.data ?? [];
  const candidateOrders = useMemo(
    () => orders.filter((order) => !order.inspectionId),
    [orders],
  );
  const order = orders.find((candidate) => candidate.id === serviceOrderId);

  useEffect(() => {
    if (!open) return;
    const first =
      candidateOrders.find((candidate) => candidate.id === defaultOrderId) ??
      candidateOrders[0];
    setServiceOrderId(first?.id ?? '');
    setFindings('');
    setTasks([]);
    tasksInitialized.current = false;
  }, [open, defaultOrderId, candidateOrders]);

  useEffect(() => {
    if (!open || serviceOrderId || candidateOrders.length === 0) return;
    setServiceOrderId(candidateOrders[0].id);
  }, [open, serviceOrderId, candidateOrders]);

  useEffect(() => {
    if (!open || !serviceOrderId || !catalogsQuery.data || tasksInitialized.current) return;
    const selected = orders.find((candidate) => candidate.id === serviceOrderId);
    setTasks(initialTasks(catalogsQuery.data, selected?.equipment.type));
    tasksInitialized.current = true;
  }, [open, serviceOrderId, catalogsQuery.data, orders]);

  const handleOrderChange = (value: string) => {
    setServiceOrderId(value);
    const next = orders.find((candidate) => candidate.id === value);
    setTasks(initialTasks(catalogsQuery.data, next?.equipment.type));
    tasksInitialized.current = true;
  };

  const submit = () => {
    if (!serviceOrderId) {
      toast.error('Selecciona la orden de servicio');
      return;
    }

    const validTasks = tasks.filter(
      (task) => task.description.trim() && task.jobPositionId,
    );

    if (validTasks.length === 0) {
      toast.error('Agrega al menos una tarea de inspección');
      return;
    }

    onSubmit({
      serviceOrderId,
      technicalDetails: findings.trim() || null,
      tasks: validTasks.map((task) => ({
        ...task,
        description: task.description.trim(),
      })),
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nueva inspección"
      description="Taller recibe la ODS y define las tareas de inspección por proceso, puesto y etapa. Calidad siempre participa."
      className="sm:max-w-6xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? 'Guardando…' : 'Crear inspección'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Orden de servicio</FieldLabel>
            <Select value={serviceOrderId} onValueChange={handleOrderChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona la ODS" />
              </SelectTrigger>
              <SelectContent>
                {candidateOrders.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.orderNumber} · {candidate.client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Equipo</FieldLabel>
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground">
              {order?.equipment.code} · {order?.equipment.name}
            </div>
          </Field>
        </div>

        {order && (
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Descripción:</strong> {order.description}
            </p>
            <p className="mt-1">
              <strong className="text-foreground">Alcance:</strong> {order.scope}
            </p>
            <p className="mt-1">
              <strong className="text-foreground">Sitio:</strong> {order.site.name} ·{' '}
              <strong className="text-foreground">Entrega:</strong>{' '}
              {order.dueAt ? new Date(order.dueAt).toLocaleDateString('es-VE') : 'Sin fecha'}
            </p>
          </div>
        )}

        {!ordersQuery.isLoading && candidateOrders.length === 0 && (
          <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-[11px] text-muted-foreground">
            Todas las ODS tienen una inspección activa. Crea una nueva ODS o rechaza la inspección existente.
          </p>
        )}

        <Field>
          <FieldLabel htmlFor="inspection-findings">Hallazgos / observaciones de la inspección</FieldLabel>
          <Textarea
            id="inspection-findings"
            rows={2}
            value={findings}
            onChange={(event) => setFindings(event.target.value)}
            placeholder="Ej: Se detectó desgaste en la biela y fisura superficial."
          />
        </Field>

        <ApiTaskBuilder tasks={tasks} onChange={setTasks} defaultStage={1} />
      </div>
    </FormDialog>
  );
}
