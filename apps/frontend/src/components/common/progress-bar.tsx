import { cn } from '@/lib/utils';
import type { StatusTone } from './status-badge';

interface ProgressBarProps {
  value: number;
  label?: string;
  showValue?: boolean;
  tone?: StatusTone;
  className?: string;
}

const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-muted-foreground',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  accent: 'bg-primary',
};

export function ProgressBar({ value, label, showValue = true, tone = 'success', className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          {label && <span>{label}</span>}
          {showValue && <span className="font-mono tabular-nums text-foreground">{clamped}%</span>}
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progreso'}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-300', toneClasses[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
