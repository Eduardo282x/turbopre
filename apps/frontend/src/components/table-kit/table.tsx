import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Pagination } from './pagination';
import { DataTableRowActions } from './row-actions';
import type { DataTableColumn, DataTableProps } from './types';

type SortState = { columnId: string; direction: 'asc' | 'desc' } | null;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function compareValues(a: string | number | Date | null | undefined, b: string | number | Date | null | undefined): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
}

function alignClass(align: DataTableColumn<unknown>['align']): string {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

export function DataTable<TData>({
  data,
  columns,
  getRowId,
  search,
  filters,
  toolbarActions,
  actions = [],
  actionsLabel = 'Acciones',
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  isLoading = false,
  emptyTitle = 'Sin registros',
  emptyDescription = 'No hay datos para mostrar con los filtros actuales.',
  emptyIcon,
  caption,
  onRowClick,
  rowClassName,
  className,
}: DataTableProps<TData>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, sort, pageSize, data.length]);

  const filtered = useMemo(() => {
    if (!search || !searchTerm.trim()) return data;
    const term = normalize(searchTerm.trim());
    return data.filter((row) => normalize(search.getText(row)).includes(term));
  }, [data, search, searchTerm]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((item) => item.id === sort.columnId);
    if (!column?.sortValue) return filtered;
    return [...filtered].sort((a, b) => {
      const result = compareValues(column.sortValue?.(a), column.sortValue?.(b));
      return sort.direction === 'asc' ? result : -result;
    });
  }, [columns, filtered, sort]);

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, pageSize, sorted],
  );

  const toggleSort = (column: DataTableColumn<TData>) => {
    if (!column.sortable || !column.sortValue) return;
    setSort((current) => {
      if (!current || current.columnId !== column.id) {
        return { columnId: column.id, direction: 'asc' };
      }
      return current.direction === 'asc' ? { columnId: column.id, direction: 'desc' } : null;
    });
  };

  const hasToolbar = Boolean(search || filters || toolbarActions);
  const totalColumns = columns.length + (actions.length > 0 ? 1 : 0);

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border/80 bg-card/70', className)}>
      {hasToolbar && (
        <div className="flex flex-col gap-3 border-b border-border/70 p-3 sm:flex-row sm:items-center">
          {search && (
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={search.placeholder ?? 'Buscar…'}
                aria-label={search.placeholder ?? 'Buscar en la tabla'}
                className="pl-8"
              />
            </div>
          )}
          {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
          {toolbarActions && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{toolbarActions}</div>}
        </div>
      )}

      <Table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((column) => {
              const sortable = Boolean(column.sortable && column.sortValue);
              const isSorted = sort?.columnId === column.id;
              return (
                <TableHead
                  key={column.id}
                  aria-sort={isSorted ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : sortable ? 'none' : undefined}
                  className={cn(
                    'h-10 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground',
                    alignClass(column.align),
                    column.hideOnMobile && 'hidden md:table-cell',
                    column.headerClassName,
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {column.header}
                      {isSorted ? (
                        sort?.direction === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
            {actions.length > 0 && (
              <TableHead className="h-10 w-14 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="sr-only">{actionsLabel}</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: Math.min(pageSize, 5) }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`}>
                {Array.from({ length: totalColumns }).map((__, cellIndex) => (
                  <TableCell key={`skeleton-cell-${cellIndex}`}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : pageRows.length > 0 ? (
            pageRows.map((row) => {
              const clickable = Boolean(onRowClick);
              return (
                <TableRow
                  key={getRowId(row)}
                  onClick={clickable ? () => onRowClick?.(row) : undefined}
                  onKeyDown={
                    clickable
                      ? (event) => {
                          if (event.target !== event.currentTarget) return;
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onRowClick?.(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={clickable ? 0 : undefined}
                  className={cn(
                    clickable && 'cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none',
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${getRowId(row)}-${column.id}`}
                      className={cn(
                        alignClass(column.align),
                        column.hideOnMobile && 'hidden md:table-cell',
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell className="text-right">
                      <DataTableRowActions row={row} actions={actions} label={actionsLabel} />
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={totalColumns} className="py-10">
                <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalItems > 0 && (
        <Pagination
          page={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}

