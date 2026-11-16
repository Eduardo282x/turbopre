import { Boxes, CheckCircle2, PackageX, Plus, Trash2, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { CalibrationStatusBadge } from '@/components/common/badges';
import { StatusBadge } from '@/components/common/status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { FormDialog } from '@/components/common/form-dialog';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { INVENTORY_STATUS_META } from '@/features/preview/config';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { InventoryItem } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';
import { canManageInventory } from '@/lib/permissions';

export function InventoryPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const addInventoryItem = usePreviewStore((state) => state.addInventoryItem);
  const deleteInventoryItem = usePreviewStore((state) => state.deleteInventoryItem);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<InventoryItem | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Mecánica');
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');

  if (!user) return null;

  const available = db.inventory.filter((item) => item.status === 'AVAILABLE').length;
  const loaned = db.inventory.filter((item) => item.status === 'LOANED').length;
  const outOfStock = db.inventory.filter((item) => item.status === 'OUT_OF_STOCK').length;

  const columns: DataTableColumn<InventoryItem>[] = [
    {
      id: 'name',
      header: 'Producto',
      cell: (item) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.code}</p>
        </div>
      ),
      sortable: true,
      sortValue: (item) => item.name,
    },
    {
      id: 'category',
      header: 'Categoría',
      cell: (item) => <span className="text-xs">{item.category}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (item) => item.category,
    },
    {
      id: 'quantity',
      header: 'Cantidad',
      cell: (item) => <span className="font-mono text-sm">{item.quantity}</span>,
      sortable: true,
      sortValue: (item) => item.quantity,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (item) => {
        const meta = INVENTORY_STATUS_META[item.status];
        return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
      },
    },
    {
      id: 'location',
      header: 'Ubicación',
      cell: (item) => <span className="text-xs text-muted-foreground">{item.location}</span>,
      hideOnMobile: true,
    },
    {
      id: 'trace',
      header: 'Trazabilidad',
      cell: (item) => (
        <div className="text-[11px] text-muted-foreground">
          <p className="font-mono text-foreground">{item.qrCode ?? 'Sin QR'}</p>
          <p>{item.controlledAtmosphere ? 'Atmósfera controlada' : 'Ambiente normal'}</p>
          {item.laserMarked && <p>Marcado láser</p>}
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'calibration',
      header: 'Calibración',
      cell: (item) => {
        if (!item.calibrationDue) return <span className="text-xs text-muted-foreground">No aplica</span>;
        const days = Math.ceil((new Date(item.calibrationDue).getTime() - Date.now()) / 86400000);
        const status = days < 0 ? 'EXPIRED' : days <= 30 ? 'DUE_SOON' : 'VALID';
        return (
          <div className="space-y-1 text-xs">
            <CalibrationStatusBadge status={status} />
            <p className="text-muted-foreground">{formatDate(item.calibrationDue)}</p>
          </div>
        );
      },
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Almacén"
        title="Inventario"
        description="Existencias, ubicaciones y disponibilidad de materiales y herramientas."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/almacen/calibracion">Calibración</Link>
            </Button>
            {canManageInventory(user) && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus /> Registrar producto
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Productos" value={db.inventory.length} hint="Registros en inventario" icon={Boxes} tone="accent" />
        <KpiCard label="Disponibles" value={available} hint="Listos para entrega" icon={CheckCircle2} tone="success" />
        <KpiCard label="Prestados" value={loaned} hint="Fuera del almacén" icon={Truck} tone="warning" />
        <KpiCard label="Sin stock" value={outOfStock} hint="Requieren reposición" icon={PackageX} tone="danger" />
      </div>

      <DataTable
        data={db.inventory}
        columns={columns}
        getRowId={(item) => item.id}
        search={{
          placeholder: 'Buscar por producto, código o categoría…',
          getText: (item) => `${item.name} ${item.code} ${item.category} ${item.location}`,
        }}
        actions={[
          {
            label: 'Eliminar',
            icon: Trash2,
            variant: 'destructive',
            hidden: (item) => !canManageInventory(user) || item.status === 'LOANED',
            onSelect: (item) => setDeleting(item),
          },
        ]}
        pageSize={10}
        emptyTitle="Sin productos"
        emptyDescription="Registra el primer producto del almacén."
        caption="Inventario del almacén"
      />

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Registrar producto"
        description="Agrega un material o herramienta al inventario."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!name.trim() || !code.trim()) {
                  toast.error('El nombre y el código son obligatorios');
                  return;
                }
                addInventoryItem(
                  {
                    name: name.trim(),
                    code: code.trim().toUpperCase(),
                    category: category.trim() || 'General',
                    quantity,
                    location: location.trim() || 'Sin ubicación',
                  },
                  user.id,
                );
                toast.success('Producto registrado');
                setCreateOpen(false);
                setName('');
                setCode('');
                setQuantity(1);
                setLocation('');
              }}
            >
              Guardar producto
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="inv-name">Nombre</FieldLabel>
            <Input id="inv-name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="inv-code">Código</FieldLabel>
            <Input id="inv-code" value={code} onChange={(event) => setCode(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="inv-category">Categoría</FieldLabel>
            <Input id="inv-category" value={category} onChange={(event) => setCategory(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="inv-quantity">Cantidad</FieldLabel>
            <Input
              id="inv-quantity"
              type="number"
              min={0}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="inv-location">Ubicación</FieldLabel>
            <Input id="inv-location" value={location} onChange={(event) => setLocation(event.target.value)} />
          </Field>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Eliminar producto"
        description={`¿Seguro que deseas eliminar ${deleting?.name ?? 'el producto'} del inventario?`}
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={() => {
          if (!deleting) return;
          deleteInventoryItem(deleting.id, user.id);
          toast.info('Producto eliminado');
          setDeleting(null);
        }}
      />
    </div>
  );
}
