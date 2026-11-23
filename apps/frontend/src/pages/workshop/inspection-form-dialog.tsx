import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FormDialog } from '@/components/common/form-dialog';
import { TaskBuilder } from '@/components/tasks/task-builder';
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
import { getServiceOrdersWithRelations } from '@/features/preview/store/selectors';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { NewInspectionInput, NewTaskInput, ProcessId } from '@/features/preview/types';

interface InspectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultOrderId?: string;
  onSubmit: (input: NewInspectionInput) => void;
}

function processForAsset(assetType?: string): ProcessId {
  if (assetType === 'GENERATOR') return 'generators';
  if (assetType === 'COMPRESSOR') return 'rotating';
  if (assetType === 'GAS_TURBINE' || assetType === 'STEAM_TURBINE') return 'rotating';
  return 'machining';
}

function initialTasks(processId: ProcessId): NewTaskInput[] {
  return [
    {
      stage: 1,
      processId,
      positionId: processId === 'generators' ? 'abrasive_operator' : processId === 'machining' ? 'machine_operator_1' : 'rotating_specialist',
      description: 'Inspección visual y dimensional del equipo.',
      criteria: 'PR-TUR-100',
      forms: 'FO-ING-110',
    },
    {
      stage: 1,
      processId: 'quality',
      positionId: 'quality_inspector',
      description: 'Inspección de limpieza y registro fotográfico.',
      criteria: 'PR-CAL-109',
      forms: 'FO-ING-155',
    },
  ];
}

export function InspectionFormDialog({ open, onOpenChange, defaultOrderId, onSubmit }: InspectionFormDialogProps) {
  const db = usePreviewStore((state) => state.db);
  const orders = useMemo(() => getServiceOrdersWithRelations(db), [db]);
  const candidateOrders = useMemo(
    () => orders.filter((order) => !order.inspectionId),
    [orders],
  );
  const [serviceOrderId, setServiceOrderId] = useState('');
  const [findings, setFindings] = useState('');
  const [tasks, setTasks] = useState<NewTaskInput[]>([]);

  useEffect(() => {
    if (!open) return;
    const first =
      candidateOrders.find((order) => order.id === defaultOrderId) ??
      candidateOrders[0];
    setServiceOrderId(first?.id ?? '');
    setFindings('');
    setTasks(initialTasks(processForAsset(first?.asset?.type)));
  }, [open, defaultOrderId, candidateOrders]);

  const order = orders.find((candidate) => candidate.id === serviceOrderId);

  const handleOrderChange = (value: string) => {
    setServiceOrderId(value);
    const next = orders.find((candidate) => candidate.id === value);
    setTasks(initialTasks(processForAsset(next?.asset?.type)));
  };

  const submit = () => {
    if (!serviceOrderId) {
      toast.error('Selecciona la orden de servicio');
      return;
    }
    const validTasks = tasks.filter((task) => task.description.trim());
    if (validTasks.length === 0) {
      toast.error('Agrega al menos una tarea de inspección');
      return;
    }
    onSubmit({
      serviceOrderId,
      findings: findings.trim() || undefined,
      tasks: validTasks.map((task) => ({ ...task, description: task.description.trim() })),
    });
    onOpenChange(false);
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
          <Button type="button" onClick={submit}>
            Crear inspección
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
                    {candidate.code} · {candidate.subCode} · {candidate.client?.name ?? 'Sin cliente'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Equipo</FieldLabel>
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground">
              {order?.asset?.manufacturer} {order?.asset?.model} · {order?.asset?.tag}
            </div>
          </Field>
        </div>

        {order && (
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
            <p><strong className="text-foreground">Descripción:</strong> {order.description}</p>
            <p className="mt-1"><strong className="text-foreground">Alcance:</strong> {order.scope}</p>
            <p className="mt-1"><strong className="text-foreground">Sitio:</strong> {order.site} · <strong className="text-foreground">Entrega:</strong> {new Date(order.dueDate).toLocaleDateString('es-VE')}</p>
          </div>
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

        <TaskBuilder tasks={tasks} onChange={setTasks} defaultStage={1} defaultProcessId={processForAsset(order?.asset?.type)} />
      </div>
    </FormDialog>
  );
}
