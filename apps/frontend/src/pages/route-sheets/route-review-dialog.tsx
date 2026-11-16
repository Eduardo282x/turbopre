import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RouteStatusBadge } from '@/components/common/badges';
import { FormDialog } from '@/components/common/form-dialog';
import { ProgressBar } from '@/components/common/progress-bar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AREA_BY_ID } from '@/features/preview/config';
import { getRouteProgress } from '@/features/preview/store/selectors';
import type { RouteSheetWithRelations } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';

interface RouteReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: RouteSheetWithRelations | null;
  mode: 'approval' | 'quality';
  onApprove: (observations?: string) => void;
  onReject: (reason: string) => void;
}

export function RouteReviewDialog({
  open,
  onOpenChange,
  route,
  mode,
  onApprove,
  onReject,
}: RouteReviewDialogProps) {
  const [observations, setObservations] = useState('');

  useEffect(() => {
    if (open) setObservations('');
  }, [open]);

  if (!route) return null;

  const approveLabel = mode === 'approval' ? 'Aprobar hoja de ruta' : 'Dar visto bueno';
  const title = mode === 'approval' ? 'Revisión técnica' : 'Evaluación de calidad';

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${title} · ${route.code}`}
      description={`${route.component.name} · ${route.client?.name ?? 'Sin cliente'} · Entrega ${formatDate(route.dueDate)}`}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (!observations.trim()) {
                toast.error('Escribe el motivo del rechazo');
                return;
              }
              onReject(observations.trim());
              onOpenChange(false);
            }}
          >
            Rechazar
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApprove(observations.trim() || undefined);
              onOpenChange(false);
            }}
          >
            {approveLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <RouteStatusBadge status={route.status} />
          <span className="text-xs text-muted-foreground">{route.description}</span>
        </div>

        <ProgressBar
          value={route.progress}
          label={`${route.completedPhases} de ${route.totalPhases} fases completadas`}
        />

        <div className="space-y-3">
          {route.parts.map((part) => {
            const partPhases = route.phases
              .filter((phase) => phase.partId === part.id)
              .sort((a, b) => a.order - b.order);
            const progress = getRouteProgress(partPhases);
            return (
              <div key={part.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {part.name} <span className="text-xs font-normal text-muted-foreground">· {part.quantity} und.</span>
                  </p>
                  <span className="text-xs text-muted-foreground">{progress.progress}%</span>
                </div>
                <ProgressBar value={progress.progress} showValue={false} className="mt-2" />
                <ol className="mt-2 space-y-1">
                  {partPhases.map((phase) => (
                    <li key={phase.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-foreground">
                        {phase.order} · {phase.name}
                      </span>
                      <span className="text-muted-foreground">
                        {AREA_BY_ID[phase.areaId].shortName} · {phase.status === 'COMPLETED' ? 'Completada' : phase.status === 'IN_PROGRESS' ? 'En proceso' : phase.status === 'BLOCKED' ? 'Bloqueada' : 'Pendiente'}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {mode === 'approval' ? 'Observaciones de revisión' : 'Observaciones de calidad'}
          </p>
          <Textarea
            rows={3}
            value={observations}
            onChange={(event) => setObservations(event.target.value)}
            placeholder={mode === 'approval' ? 'Opcional al aprobar; obligatorio al rechazar.' : 'Opcional al aprobar; obligatorio al rechazar.'}
          />
        </div>
      </div>
    </FormDialog>
  );
}
