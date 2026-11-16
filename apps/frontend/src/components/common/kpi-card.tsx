import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StatusTone } from './status-badge';

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: StatusTone;
  className?: string;
}

const toneStyles: Record<StatusTone, { bar: string; icon: string; value: string }> = {
  neutral: { bar: 'bg-muted-foreground/50', icon: 'bg-muted text-muted-foreground', value: 'text-foreground' },
  info: { bar: 'bg-info', icon: 'bg-info/10 text-info', value: 'text-info' },
  success: { bar: 'bg-success', icon: 'bg-success/10 text-success', value: 'text-success' },
  warning: { bar: 'bg-warning', icon: 'bg-warning/10 text-warning', value: 'text-warning' },
  danger: { bar: 'bg-destructive', icon: 'bg-destructive/10 text-destructive', value: 'text-destructive' },
  accent: { bar: 'bg-primary', icon: 'bg-primary/10 text-primary', value: 'text-primary' },
};

export function KpiCard({ label, value, hint, icon: Icon, tone = 'accent', className }: KpiCardProps) {
  const styles = toneStyles[tone];
  return (
    <Card className={cn('relative gap-0 overflow-hidden border-border/80 bg-card/80 py-0', className)}>
      <span className={cn('absolute inset-y-0 left-0 w-1', styles.bar)} aria-hidden="true" />
      <CardContent className="flex items-start justify-between gap-4 p-5 pl-6">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className={cn('font-heading text-3xl font-bold tracking-tight', styles.value)}>{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', styles.icon)}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
      </CardContent>
    </Card>
  );
}
