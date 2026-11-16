import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { ProgressBar } from '@/components/common/progress-bar';
import { StatusBadge, type StatusTone } from '@/components/common/status-badge';
import { cn } from '@/lib/utils';

export interface OperationsRadarItem {
  id: string;
  code: string;
  component: string;
  progress: number;
  area: string;
  responsible: string;
  statusLabel: string;
  tone: StatusTone;
}

interface OperationsRadarProps {
  items: OperationsRadarItem[];
  className?: string;
}

export function OperationsRadar({ items, className }: OperationsRadarProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item) => (
        <Link
          key={item.id}
          to={`/hojas-de-ruta/${item.id}`}
          className="group block rounded-xl border border-border/70 bg-background/40 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {item.code}
                <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
              <p className="truncate text-xs text-muted-foreground">{item.component}</p>
            </div>
            <StatusBadge tone={item.tone} dot>
              {item.statusLabel}
            </StatusBadge>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar value={item.progress} tone={item.tone === 'neutral' ? 'accent' : item.tone} className="flex-1" showValue={false} />
            <span className="w-10 text-right font-mono text-xs tabular-nums text-foreground">{item.progress}%</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span>
              Área actual: <span className="font-medium text-foreground">{item.area}</span>
            </span>
            <span>
              Responsable: <span className="font-medium text-foreground">{item.responsible}</span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
