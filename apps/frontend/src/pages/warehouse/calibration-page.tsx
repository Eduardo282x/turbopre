import { CalendarClock, CheckCircle2, Gauge, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CalibrationStatusBadge } from '@/components/common/badges';
import { FormDialog } from '@/components/common/form-dialog';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getCalibrationItems } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { formatDate, toDateInputValue } from '@/lib/formatters';
import { canManageCalibration } from '@/lib/permissions';

interface CalibrationRow {
  itemId: string;
  name: string;
  code: string;
  location: string;
  certificate?: string;
  calibrationDue: string;
  days: number;
  status: 'VALID' | 'DUE_SOON' | 'EXPIRED';
}

export function CalibrationPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const calibrateInventoryItem = usePreviewStore((state) => state.calibrateInventoryItem);
  const [selected, setSelected] = useState<CalibrationRow | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [certificate, setCertificate] = useState('');

  if (!user) return null;

  const items = getCalibrationItems(db);
  const rows: CalibrationRow[] = items.map(({ item, days, status }) => ({
    itemId: item.id,
    name: item.name,
    code: item.code,
    location: item.location,
    certificate: item.certificate,
    calibrationDue: item.calibrationDue as string,
    days,
    status,
  }));

  const valid = rows.filter((row) => row.status === 'VALID').length;
  const dueSoon = rows.filter((row) => row.status === 'DUE_SOON').length;
  const expired = rows.filter((row) => row.status === 'EXPIRED').length;

  const openCalibration = (row: CalibrationRow) => {
    setSelected(row);
    setDueDate(toDateInputValue(new Date(Date.now() + 180 * 86400000)));
    setCertificate('');
  };

  const columns: DataTableColumn<CalibrationRow>[] = [
    {
      id: 'item',
      header: 'Instrumento',
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.code} · {row.location}</p>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.name,
    },
    {
      id: 'certificate',
      header: 'Certificado',
      cell: (row) => <span className="text-xs text-muted-foreground">{row.certificate ?? '—'}</span>,
      hideOnMobile: true,
    },
    {
      id: 'due',
      header: 'Vence',
      cell: (row) => <span className="text-xs text-foreground">{formatDate(row.calibrationDue)}</span>,
      sortable: true,
      sortValue: (row) => new Date(row.calibrationDue),
    },
    {
      id: 'days',
      header: 'Días',
      cell: (row) => (
        <span className={row.days < 0 ? 'text-destructive' : row.days <= 30 ? 'text-warning' : 'text-success'}>
          {row.days < 0 ? `${Math.abs(row.days)} vencidos` : `${row.days} días`}
        </span>
      ),
      sortable: true,
      sortValue: (row) => row.days,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (row) => <CalibrationStatusBadge status={row.status} />,
      sortable: true,
      sortValue: (row) => row.status,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Almacén / metrología"
        title="Calibración de instrumentos"
        description="Equipos de seguimiento y medición con certificado y fecha de vencimiento."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Instrumentos" value={rows.length} hint="Con control de calibración" icon={Gauge} tone="accent" />
        <KpiCard label="Vigentes" value={valid} hint="Dentro del período" icon={CheckCircle2} tone="success" />
        <KpiCard label="Por vencer" value={dueSoon} hint="Próximos 30 días" icon={CalendarClock} tone="warning" />
        <KpiCard label="Vencidos" value={expired} hint="Requieren calibración" icon={ShieldAlert} tone="danger" />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.itemId}
        search={{
          placeholder: 'Buscar por instrumento, código o ubicación…',
          getText: (row) => `${row.name} ${row.code} ${row.location} ${row.certificate ?? ''}`,
        }}
        actions={[
          {
            label: 'Registrar calibración',
            icon: CalendarClock,
            hidden: () => !canManageCalibration(user),
            onSelect: openCalibration,
          },
        ]}
        pageSize={10}
        emptyTitle="Sin instrumentos calibrados"
        emptyDescription="Los instrumentos con fecha de calibración aparecerán aquí."
        caption="Calibración de instrumentos"
      />

      <FormDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title="Registrar calibración"
        description={selected ? `${selected.name} · ${selected.code}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!selected) return;
                if (!dueDate || !certificate.trim()) {
                  toast.error('Indica la fecha y el certificado de calibración');
                  return;
                }
                calibrateInventoryItem(selected.itemId, new Date(`${dueDate}T12:00:00`).toISOString(), certificate.trim(), user.id);
                toast.success('Calibración registrada');
                setSelected(null);
              }}
            >
              Guardar calibración
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="cal-due">Vence</FieldLabel>
            <Input id="cal-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="cal-certificate">Certificado</FieldLabel>
            <Input id="cal-certificate" value={certificate} onChange={(event) => setCertificate(event.target.value)} placeholder="CAL-2026-001" />
          </Field>
        </div>
      </FormDialog>
    </div>
  );
}
