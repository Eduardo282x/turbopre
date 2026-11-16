import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileDropzone } from '@/components/common/file-dropzone';
import { FormDialog } from '@/components/common/form-dialog';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { AREA_BY_ID, PHASE_TYPE_LABELS } from '@/features/preview/config';
import type { PhaseWithContext } from '@/features/preview/store/selectors';

interface CompletePhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: PhaseWithContext | null;
  onSubmit: (payload: { observations?: string; evidence?: string }) => void;
}

export function CompletePhaseDialog({ open, onOpenChange, context, onSubmit }: CompletePhaseDialogProps) {
  const [observations, setObservations] = useState('');
  const [evidence, setEvidence] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setObservations('');
      setEvidence(undefined);
    }
  }, [open]);

  if (!context) return null;

  const submit = () => {
    if (!evidence) {
      toast.error('Adjunta una evidencia fotográfica antes de completar la fase');
      return;
    }
    onSubmit({ observations: observations.trim() || undefined, evidence });
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Completar fase"
      description="Registra el avance con una evidencia y observaciones del área."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit}>
            Marcar como completada
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="accent">{AREA_BY_ID[context.phase.areaId].shortName}</StatusBadge>
            <StatusBadge tone="neutral">{PHASE_TYPE_LABELS[context.phase.type]}</StatusBadge>
            <span className="text-xs text-muted-foreground">Paso {context.phase.order}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">{context.phase.name}</p>
          <p className="text-xs text-muted-foreground">{context.phase.description}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {context.route.code} · {context.component.name} · Parte: {context.part.name}
          </p>
        </div>

        <FileDropzone value={evidence} onChange={setEvidence} required />

        <Field>
          <FieldLabel htmlFor="phase-observations">Observaciones (opcional)</FieldLabel>
          <Textarea
            id="phase-observations"
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
