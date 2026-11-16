import { Cell, Pie, PieChart as RechartsPieChart } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import type { ChartDatum } from './simple-bar-chart';

interface DonutChartProps {
  data: ChartDatum[];
  centerLabel?: string;
  centerValue?: string | number;
  height?: number;
  showLegend?: boolean;
  className?: string;
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  height = 260,
  showLegend = true,
  className,
}: DonutChartProps) {
  const config = data.reduce<ChartConfig>((accumulator, entry, index) => {
    accumulator[entry.name] = {
      label: entry.name,
      color: entry.color ?? `var(--chart-${(index % 5) + 1})`,
    };
    return accumulator;
  }, {});

  return (
    <div className="relative" style={{ height }}>
      <ChartContainer config={config} className={cn('aspect-auto', className)} style={{ height }}>
        <RechartsPieChart accessibilityLayer>
          <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="name" hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={entry.color ?? `var(--chart-${(index % 5) + 1})`} />
            ))}
          </Pie>
          {showLegend && <ChartLegend content={<ChartLegendContent nameKey="name" />} />}
        </RechartsPieChart>
      </ChartContainer>
      {(centerLabel || centerValue !== undefined) && (
        <div className="pointer-events-none absolute inset-x-0 top-[42%] flex -translate-y-1/2 flex-col items-center">
          {centerValue !== undefined && (
            <span className="font-heading text-2xl font-bold tracking-tight text-foreground">{centerValue}</span>
          )}
          {centerLabel && <span className="text-[11px] text-muted-foreground">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}
