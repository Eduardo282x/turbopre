import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '@/components/common/status-badge';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AUDIT_ACTION_META } from '@/features/preview/config';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { AuditEntry } from '@/features/preview/types';
import { formatDateTime } from '@/lib/formatters';

export function AuditPage() {
  const db = usePreviewStore((state) => state.db);
  const [actionFilter, setActionFilter] = useState('all');

  const entries = db.audit
    .filter((entry) => actionFilter === 'all' || entry.action === actionFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const columns: DataTableColumn<AuditEntry>[] = [
    {
      id: 'date',
      header: 'Fecha',
      cell: (entry) => <span className="font-mono text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>,
      sortable: true,
      sortValue: (entry) => new Date(entry.createdAt),
    },
    {
      id: 'user',
      header: 'Usuario',
      cell: (entry) => <span className="text-sm font-medium text-foreground">{entry.userName}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (entry) => entry.userName,
    },
    {
      id: 'action',
      header: 'Acción',
      cell: (entry) => {
        const meta = AUDIT_ACTION_META[entry.action];
        return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
      },
      sortable: true,
      sortValue: (entry) => entry.action,
    },
    {
      id: 'entity',
      header: 'Entidad',
      cell: (entry) => (
        <div className="text-xs">
          <p className="text-foreground">{entry.entity}</p>
          <p className="font-mono text-muted-foreground">{entry.entityId}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'detail',
      header: 'Detalle',
      cell: (entry) => <span className="block max-w-96 text-xs text-muted-foreground">{entry.detail}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Auditoría"
        description="Registro histórico de las acciones realizadas en el modo preview."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard label="Eventos registrados" value={db.audit.length} hint="Historial completo" icon={ShieldCheck} tone="accent" />
        <KpiCard
          label="Eventos mostrados"
          value={entries.length}
          hint="Según el filtro actual"
          icon={ShieldCheck}
          tone="info"
        />
      </div>

      <DataTable
        data={entries}
        columns={columns}
        getRowId={(entry) => entry.id}
        search={{
          placeholder: 'Buscar por usuario, entidad o detalle…',
          getText: (entry) => `${entry.userName} ${entry.entity} ${entry.entityId} ${entry.detail}`,
        }}
        filters={
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las acciones</SelectItem>
              {Object.entries(AUDIT_ACTION_META).map(([action, meta]) => (
                <SelectItem key={action} value={action}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        pageSize={15}
        pageSizeOptions={[10, 15, 25, 50]}
        emptyTitle="Sin eventos"
        emptyDescription="No hay registros de auditoría para el filtro seleccionado."
        caption="Auditoría del sistema"
      />
    </div>
  );
}
