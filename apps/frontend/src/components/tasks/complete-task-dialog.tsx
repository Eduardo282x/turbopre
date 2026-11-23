import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileDropzone } from '@/components/common/file-dropzone';
import { FormDialog } from '@/components/common/form-dialog';
import { ProcessBadge, PositionBadge } from '@/components/common/badges';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import type { TaskWithContext } from '@/features/preview/types';

interface CompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: TaskWithContext | null;
  onSubmit: (payload: { observations?: string; evidence?: string }) => void;
}

export function CompleteTaskDialog({ open, onOpenChange, context, onSubmit }: CompleteTaskDialogProps) {
  const [observations, setObservations] = useState('');
  const [evidence, setEvidence] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setObservations('');
      setEvidence(undefined);
    }
  }, [open]);

  if (!context) return null;

  const { task, process, position, routeSheet, inspection, client, asset } = context;
  const ownerCode = routeSheet?.code ?? inspection?.code ?? '—';

  const submit = () => {
    if (!evidence) {
      toast.error('Adjunta una evidencia fotográfica antes de marcar la tarea como lista');
      return;
    }
    onSubmit({ observations: observations.trim() || undefined, evidence });
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
          <Button type="button" onClick={submit}>
            Marcar listo ✅
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <ProcessBadge processId={process.id} />
            <PositionBadge positionId={position.id} />
            <span className="text-xs text-muted-foreground">Paso {task.step}</span>
            <span className="text-xs text-muted-foreground">Etapa {task.stage}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">{task.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ownerCode} · {client?.name ?? 'Sin cliente'} · {asset?.manufacturer} {asset?.model}
          </p>
          {(task.criteria || task.forms) && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {task.criteria ? `Criterio: ${task.criteria}` : ''}
              {task.criteria && task.forms ? ' · ' : ''}
              {task.forms ? `Formulario: ${task.forms}` : ''}
            </p>
          )}
        </div>

        <FileDropzone value={evidence} onChange={setEvidence} required />

        <Field>
          <FieldLabel htmlFor="task-observations">Observaciones (opcional)</FieldLabel>
          <Textarea
            id="task-observations"
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
