import type { CSSProperties, ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

const toneClasses: Record<StatusTone, string> = {
  neutral: 'border-border bg-muted/60 text-muted-foreground',
  info: 'border-info/30 bg-info/10 text-info',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  accent: 'border-primary/30 bg-primary/10 text-primary',
};

const dotClasses: Record<StatusTone, string> = {
  neutral: 'bg-muted-foreground',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  accent: 'bg-primary',
};

interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
  dot?: boolean;
  style?: CSSProperties;
}

export function StatusBadge({ children, tone = 'neutral', className, dot = false, style }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', toneClasses[tone], className)} style={style}>
      {dot && <span className={cn('size-1.5 rounded-full', dotClasses[tone])} aria-hidden="true" />}
      {children}
    </Badge>
  );
}
