import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { cn } from '@/lib/utils';
import { ChartNoAxesCombined } from 'lucide-react';

interface ChartCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
  contentClassName?: string;
}

export function ChartCard({
  title,
  description,
  actions,
  children,
  empty = false,
  emptyMessage = 'Todavía no hay datos suficientes para graficar.',
  className,
  contentClassName,
}: ChartCardProps) {
  return (
    <Card className={cn('gap-0 overflow-hidden border-border/80 bg-card/80 py-0', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className={cn('p-5', contentClassName)}>
        {empty ? <EmptyState icon={ChartNoAxesCombined} title="Sin datos" description={emptyMessage} /> : children}
      </CardContent>
    </Card>
  );
}
