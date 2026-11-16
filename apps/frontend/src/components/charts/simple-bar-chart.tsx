import { Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';

export interface ChartDatum {
  name: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: ChartDatum[];
  valueLabel?: string;
  horizontal?: boolean;
  height?: number;
  className?: string;
}

export function SimpleBarChart({
  data,
  valueLabel = 'Total',
  horizontal = false,
  height = 260,
  className,
}: SimpleBarChartProps) {
  const config = {
    value: { label: valueLabel, color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={cn('aspect-auto', className)} style={{ height }}>
      <RechartsBarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 8, right: 12, bottom: 0, left: horizontal ? 8 : 0 }}
        accessibilityLayer
      >
        <CartesianGrid vertical={horizontal} strokeDasharray="3 3" />
        <XAxis
          dataKey={horizontal ? 'value' : 'name'}
          type={horizontal ? 'number' : 'category'}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
          allowDecimals={false}
        />
        <YAxis
          dataKey={horizontal ? 'name' : 'value'}
          type={horizontal ? 'category' : 'number'}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={horizontal ? 110 : 36}
          tick={{ fontSize: 11 }}
          allowDecimals={false}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} maxBarSize={34}>
          {data.map((entry, index) => (
            <Cell key={`${entry.name}-${index}`} fill={entry.color ?? `var(--chart-${(index % 5) + 1})`} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ChartContainer>
  );
}
