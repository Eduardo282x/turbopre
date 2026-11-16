import { HandCoins, PackageCheck, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { LoanStatusBadge } from '@/components/common/badges';
import { FormDialog } from '@/components/common/form-dialog';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { Loan } from '@/features/preview/types';
import { formatDateTime } from '@/lib/formatters';

interface LoanRow extends Loan {
  itemName: string;
  itemCode: string;
}

export function LoansPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const createLoan = usePreviewStore((state) => state.createLoan);
  const returnLoan = usePreviewStore((state) => state.returnLoan);
  const [createOpen, setCreateOpen] = useState(false);
  const [itemId, setItemId] = useState('');
  const [receivedBy, setReceivedBy] = useState('');

  if (!user) return null;

  const rows: LoanRow[] = db.loans
    .map((loan) => {
      const item = db.inventory.find((entry) => entry.id === loan.itemId);
      return { ...loan, itemName: item?.name ?? 'Producto eliminado', itemCode: item?.code ?? '—' };
    })
    .sort((a, b) => new Date(b.loanedAt).getTime() - new Date(a.loanedAt).getTime());

  const active = rows.filter((loan) => loan.status === 'ACTIVE').length;
  const returned = rows.filter((loan) => loan.status === 'RETURNED').length;
  const availableItems = db.inventory.filter((item) => item.status === 'AVAILABLE');

  const columns: DataTableColumn<LoanRow>[] = [
    {
      id: 'item',
      header: 'Producto',
      cell: (loan) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{loan.itemName}</p>
          <p className="text-xs text-muted-foreground">{loan.itemCode}</p>
        </div>
      ),
      sortable: true,
      sortValue: (loan) => loan.itemName,
    },
    {
      id: 'received',
      header: 'Recibe',
      cell: (loan) => <span className="text-sm">{loan.receivedBy}</span>,
      hideOnMobile: true,
    },
    {
      id: 'authorized',
      header: 'Autorizado por',
      cell: (loan) => (
        <span className="text-xs">{db.users.find((candidate) => candidate.id === loan.authorizedBy)?.name ?? '—'}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'date',
      header: 'Fecha préstamo',
      cell: (loan) => <span className="text-xs text-muted-foreground">{formatDateTime(loan.loanedAt)}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (loan) => new Date(loan.loanedAt),
    },
    {
      id: 'returned',
      header: 'Devolución',
      cell: (loan) => (
        <span className="text-xs text-muted-foreground">
          {loan.returnedAt ? formatDateTime(loan.returnedAt) : 'Pendiente'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (loan) => <LoanStatusBadge status={loan.status} />,
      sortable: true,
      sortValue: (loan) => loan.status,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Almacén"
        title="Entregas y préstamos"
        description="Control de herramientas y materiales que salen del almacén."
        actions={
          <Button
            onClick={() => {
              setItemId(availableItems[0]?.id ?? '');
              setReceivedBy('');
              setCreateOpen(true);
            }}
          >
            <Plus /> Registrar préstamo
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard label="Préstamos activos" value={active} hint="Herramientas fuera" icon={HandCoins} tone="warning" />
        <KpiCard label="Devueltos" value={returned} hint="Historial de devoluciones" icon={PackageCheck} tone="success" />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(loan) => loan.id}
        search={{
          placeholder: 'Buscar por producto, código o persona…',
          getText: (loan) => `${loan.itemName} ${loan.itemCode} ${loan.receivedBy}`,
        }}
        actions={[
          {
            label: 'Registrar devolución',
            icon: PackageCheck,
            hidden: (loan) => loan.status !== 'ACTIVE',
            onSelect: (loan) => {
              returnLoan(loan.id, user.id);
              toast.success(`${loan.itemName} devuelto al almacén`);
            },
          },
        ]}
        pageSize={10}
        emptyTitle="Sin préstamos"
        emptyDescription="Registra la primera salida de una herramienta del almacén."
        caption="Préstamos y devoluciones"
      />

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Registrar préstamo"
        description="El producto saldrá del inventario disponible hasta su devolución."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!itemId) {
                  toast.error('Selecciona un producto disponible');
                  return;
                }
                if (!receivedBy.trim()) {
                  toast.error('Indica quién recibe el producto');
                  return;
                }
                createLoan({ itemId, receivedBy: receivedBy.trim() }, user.id);
                toast.success('Préstamo registrado');
                setCreateOpen(false);
                setReceivedBy('');
              }}
            >
              Registrar salida
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field>
            <FieldLabel>Producto</FieldLabel>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {availableItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} · {item.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="loan-received">Persona que recibe</FieldLabel>
            <Input
              id="loan-received"
              value={receivedBy}
              onChange={(event) => setReceivedBy(event.target.value)}
              placeholder="Nombre y apellido"
            />
          </Field>
        </div>
      </FormDialog>
    </div>
  );
}
