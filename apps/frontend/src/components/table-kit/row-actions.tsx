import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DataTableAction } from './types';

interface DataTableRowActionsProps<TData> {
  row: TData;
  actions: DataTableAction<TData>[];
  label?: string;
}

export function DataTableRowActions<TData>({ row, actions, label = 'Acciones' }: DataTableRowActionsProps<TData>) {
  const visible = actions.filter((action) => !action.hidden?.(row));
  if (visible.length === 0) return null;

  const destructive = visible.filter((action) => action.variant === 'destructive');
  const normal = visible.filter((action) => action.variant !== 'destructive');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {normal.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.label}
              disabled={action.disabled?.(row)}
              onSelect={() => action.onSelect(row)}
            >
              {Icon && <Icon />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
        {destructive.length > 0 && normal.length > 0 && <DropdownMenuSeparator />}
        {destructive.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.label}
              variant="destructive"
              disabled={action.disabled?.(row)}
              onSelect={() => action.onSelect(row)}
            >
              {Icon && <Icon />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
