import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileDropzone } from '@/components/common/file-dropzone';
import { FormDialog } from '@/components/common/form-dialog';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import type {
  CompleteTaskInput,
  InspectionRecord,
  RouteSheetRecord,
  TaskRecord,
} from '@turbopre/shared';

interface ApiCompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskRecord | null;
  inspection?: InspectionRecord | null;
  routeSheet?: RouteSheetRecord | null;
  pending?: boolean;
  onSubmit: (payload: CompleteTaskInput) => void;
}

export function ApiCompleteTaskDialog({
  open,
  onOpenChange,
  task,
  inspection,
  routeSheet,
  pending = false,
  onSubmit,
}: ApiCompleteTaskDialogProps) {
  const [observations, setObservations] = useState('');
  const [evidence, setEvidence] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setObservations('');
      setEvidence(undefined);
    }
  }, [open]);

  if (!task) return null;

  const submit = () => {
    if (task.requiresEvidence && !evidence) {
      toast.error('Adjunta una evidencia antes de marcar la tarea como lista');
      return;
    }

    onSubmit({
      observations: observations.trim() || null,
      evidenceUrl: evidence ?? null,
    });
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Marcar tarea como lista"
      description="Registra la evidencia del trabajo. La etapa siguiente se desbloquea automáticamente."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? 'Guardando…' : 'Marcar listo ✅'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge tone="neutral" className="border">
              {task.processName}
            </StatusBadge>
            <StatusBadge tone="neutral" className="border">
              {task.jobPositionName}
            </StatusBadge>
            <span className="text-xs text-muted-foreground">Etapa {task.stage}</span>
            {task.sequence !== null && (
              <span className="text-xs text-muted-foreground">Paso {task.sequence}</span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">{task.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {routeSheet?.code ?? inspection?.code ?? 'Inspección'} ·{' '}
            {routeSheet?.serviceOrder.clientName ??
              inspection?.serviceOrder.clientName ??
              'Sin cliente'}{' '}
            ·{' '}
            {routeSheet?.serviceOrder.equipmentName ??
              inspection?.serviceOrder.equipmentName ??
              'Sin equipo'}
          </p>
          {(task.criteria || task.formRef) && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {task.criteria ? `Criterio: ${task.criteria}` : ''}
              {task.criteria && task.formRef ? ' · ' : ''}
              {task.formRef ? `Formulario: ${task.formRef}` : ''}
            </p>
          )}
        </div>

        <FileDropzone value={evidence} onChange={setEvidence} required={task.requiresEvidence} />

        <Field>
          <FieldLabel htmlFor="api-task-observations">Observaciones (opcional)</FieldLabel>
          <Textarea
            id="api-task-observations"
            rows={3}
            value={observations}
            onChange={(event) => setObservations(event.target.value)}
            placeholder="Ej: Se verificaron dimensiones y acabado. Sin novedades."
          />
        </Field>
      </div>
    </FormDialog>
  );
}
