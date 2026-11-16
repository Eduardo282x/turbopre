import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface DataTableColumn<TData> {
  id: string;
  header: string;
  cell: (row: TData) => ReactNode;
  sortValue?: (row: TData) => string | number | Date | null | undefined;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  hideOnMobile?: boolean;
}

export interface DataTableAction<TData> {
  label: string;
  icon?: LucideIcon;
  onSelect: (row: TData) => void;
  variant?: 'default' | 'destructive';
  hidden?: (row: TData) => boolean;
  disabled?: (row: TData) => boolean;
}

export interface DataTableSearch<TData> {
  placeholder?: string;
  getText: (row: TData) => string;
}

export interface DataTableProps<TData> {
  data: TData[];
  columns: DataTableColumn<TData>[];
  getRowId: (row: TData) => string;
  search?: DataTableSearch<TData>;
  filters?: ReactNode;
  toolbarActions?: ReactNode;
  actions?: DataTableAction<TData>[];
  actionsLabel?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  caption?: string;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string | undefined;
  className?: string;
}
