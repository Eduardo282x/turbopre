import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineItem {
  title: string;
  description?: string;
  date?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const toneClasses = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
};

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('relative space-y-4 border-l border-border/80 pl-5', className)}>
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <li key={`${item.title}-${index}`} className="relative">
            <span
              className={cn(
                'absolute -left-[31px] flex size-5 items-center justify-center rounded-full ring-4 ring-background',
                toneClasses[item.tone ?? 'default'],
              )}
            >
              {Icon ? <Icon className="size-3" aria-hidden="true" /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.description && <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>}
              {item.date && <p className="text-[11px] text-muted-foreground/80">{item.date}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
