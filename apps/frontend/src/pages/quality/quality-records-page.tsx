import { CheckCircle2, Eye, FileCheck2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  QualityRecordTypeBadge,
  QualityResultBadge,
  ServiceModeBadge,
} from '@/components/common/badges';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { QualityRecord } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';
import { canManageQuality } from '@/lib/permissions';

interface QualityRow extends QualityRecord {
  orderCode: string;
  mode: 'SHOP' | 'FIELD' | 'PROJECT' | 'SUPPLY';
  clientName: string;
  assetName: string;
}

export function QualityRecordsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const updateQualityRecordResult = usePreviewStore((state) => state.updateQualityRecordResult);
  const navigate = useNavigate();

  if (!user) return null;

  const rows: QualityRow[] = db.qualityRecords.map((record) => {
    const order = db.serviceOrders.find((item) => item.id === record.serviceOrderId);
    const client = db.clients.find((item) => item.id === order?.clientId);
    const asset = db.assets.find((item) => item.id === order?.assetId);
    return {
      ...record,
      orderCode: order?.code ?? '—',
      mode: order?.mode ?? 'SHOP',
      clientName: client?.name ?? '—',
      assetName: asset ? `${asset.manufacturer} ${asset.model}` : '—',
    };
  });

  const passed = rows.filter((row) => row.result === 'PASS').length;
  const pending = rows.filter((row) => row.result === 'PENDING').length;
  const failed = rows.filter((row) => row.result === 'FAIL').length;

  const columns: DataTableColumn<QualityRow>[] = [
    {
      id: 'order',
      header: 'Expediente',
      cell: (row) => (
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">{row.orderCode}</p>
          <p className="text-xs text-muted-foreground">{row.clientName} · {row.assetName}</p>
          <ServiceModeBadge mode={row.mode} />
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.orderCode,
    },
    {
      id: 'type',
      header: 'Tipo / método',
      cell: (row) => (
        <div className="space-y-1">
          <QualityRecordTypeBadge type={row.type} />
          <p className="text-xs text-muted-foreground">{row.method}</p>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.type,
    },
    {
      id: 'standard',
      header: 'Norma / criterio',
      cell: (row) => (
        <div className="max-w-64 text-xs">
          <p className="text-foreground">{row.standard}</p>
          <p className="text-muted-foreground">{row.acceptanceCriteria}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'result',
      header: 'Resultado',
      cell: (row) => <QualityResultBadge result={row.result} />,
      sortable: true,
      sortValue: (row) => row.result,
    },
    {
      id: 'inspector',
      header: 'Inspector',
      cell: (row) => (
        <span className="text-xs">{db.users.find((candidate) => candidate.id === row.inspectorId)?.name ?? '—'}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'date',
      header: 'Fecha',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{row.testedAt ? formatDate(row.testedAt) : 'Pendiente'}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'certificate',
      header: 'Certificado',
      cell: (row) => <span className="text-xs text-muted-foreground">{row.certificate ?? '—'}</span>,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calidad"
        title="Registros NDT y pruebas"
        description="Ensayos no destructivos, pruebas eléctricas, dimensionales, balanceo y recubrimientos."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Registros" value={rows.length} hint="Todas las pruebas" icon={FileCheck2} tone="accent" />
        <KpiCard label="Aprobados" value={passed} hint="Resultado conforme" icon={CheckCircle2} tone="success" />
        <KpiCard label="Pendientes" value={pending} hint="Esperan resultado" icon={Eye} tone="warning" />
        <KpiCard label="Rechazados" value={failed} hint="Requieren acción" icon={ShieldAlert} tone="danger" />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        search={{
          placeholder: 'Buscar por expediente, tipo, método, norma o inspector…',
          getText: (row) => `${row.orderCode} ${row.type} ${row.method} ${row.standard} ${row.certificate ?? ''}`,
        }}
        actions={[
          { label: 'Ver expediente', icon: Eye, onSelect: (row) => navigate(`/expedientes/${row.serviceOrderId}`) },
          {
            label: 'Aprobar',
            icon: CheckCircle2,
            hidden: (row) => !canManageQuality(user) || row.result !== 'PENDING',
            onSelect: (row) => {
              updateQualityRecordResult(row.id, 'PASS', user.id);
              toast.success('Registro aprobado');
            },
          },
          {
            label: 'Rechazar',
            icon: ShieldAlert,
            variant: 'destructive',
            hidden: (row) => !canManageQuality(user) || row.result !== 'PENDING',
            onSelect: (row) => {
              updateQualityRecordResult(row.id, 'FAIL', user.id);
              toast.info('Registro rechazado');
            },
          },
        ]}
        pageSize={10}
        emptyTitle="Sin registros"
        emptyDescription="Los registros NDT y pruebas aparecerán aquí."
        caption="Registros de calidad"
      />
    </div>
  );
}
