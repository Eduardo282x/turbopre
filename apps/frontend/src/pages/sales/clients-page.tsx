import { Building2, Eye, Plus, Route } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { FormDialog } from '@/components/common/form-dialog';
import { PageHeader } from '@/components/common/page-header';
import { RouteStatusBadge } from '@/components/common/badges';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getRouteSheetsWithRelations } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { Client } from '@/features/preview/types';
import { formatDate } from '@/lib/formatters';

interface ClientRow extends Client {
  totalRoutes: number;
  activeRoutes: number;
  lastActivity?: string;
}

export function ClientsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const createClient = usePreviewStore((state) => state.createClient);
  const [selected, setSelected] = useState<ClientRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  if (!user) return null;

  const routes = getRouteSheetsWithRelations(db);
  const rows: ClientRow[] = db.clients.map((client) => {
    const clientRoutes = routes.filter((route) => route.client?.id === client.id);
    const last = clientRoutes
      .map((route) => route.updatedAt)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    return {
      ...client,
      totalRoutes: clientRoutes.length,
      activeRoutes: clientRoutes.filter((route) => route.status !== 'DELIVERED').length,
      lastActivity: last,
    };
  });

  const selectedRoutes = selected ? routes.filter((route) => route.client?.id === selected.id) : [];

  const columns: DataTableColumn<ClientRow>[] = [
    {
      id: 'name',
      header: 'Empresa / cliente',
      cell: (client) => (
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{client.name}</p>
            <p className="text-xs text-muted-foreground">{client.code}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (client) => client.name,
    },
    {
      id: 'contact',
      header: 'Contacto',
      cell: (client) => (
        <div className="text-xs">
          <p className="text-foreground">{client.contact}</p>
          <p className="text-muted-foreground">{client.email}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'phone',
      header: 'Teléfono',
      cell: (client) => <span className="text-xs text-muted-foreground">{client.phone}</span>,
      hideOnMobile: true,
    },
    {
      id: 'routes',
      header: 'Hojas',
      cell: (client) => (
        <div className="text-xs">
          <p className="text-foreground">{client.totalRoutes} totales</p>
          <p className="text-muted-foreground">{client.activeRoutes} activas</p>
        </div>
      ),
      sortable: true,
      sortValue: (client) => client.totalRoutes,
    },
    {
      id: 'last',
      header: 'Última actividad',
      cell: (client) => (
        <span className="text-xs text-muted-foreground">
          {client.lastActivity ? formatDate(client.lastActivity) : 'Sin actividad'}
        </span>
      ),
      hideOnMobile: true,
      sortable: true,
      sortValue: (client) => (client.lastActivity ? new Date(client.lastActivity) : null),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comercial"
        title="Clientes"
        description="Cartera de clientes y su relación con las hojas de ruta."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Nuevo cliente
          </Button>
        }
      />

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(client) => client.id}
        search={{
          placeholder: 'Buscar por empresa, código o contacto…',
          getText: (client) => `${client.name} ${client.code} ${client.contact} ${client.email}`,
        }}
        actions={[
          { label: 'Ver hojas de ruta', icon: Eye, onSelect: (client) => setSelected(client) },
        ]}
        onRowClick={(client) => setSelected(client)}
        pageSize={10}
        emptyTitle="Sin clientes"
        emptyDescription="Registra el primer cliente para asociarlo a una hoja de ruta."
        caption="Cartera de clientes"
      />

      <FormDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected ? `Hojas de ruta · ${selected.name}` : 'Cliente'}
        description="Expedientes asociados a esta empresa."
        footer={
          <Button variant="outline" onClick={() => setSelected(null)}>
            Cerrar
          </Button>
        }
      >
        <div className="space-y-2">
          {selectedRoutes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Este cliente todavía no tiene hojas de ruta.
            </p>
          ) : (
            selectedRoutes.map((route) => (
              <Link
                key={route.id}
                to={`/hojas-de-ruta/${route.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">{route.code}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {route.asset?.manufacturer} {route.asset?.model} · {route.equipmentCode}
                  </span>
                </span>
                <RouteStatusBadge status={route.status} />
              </Link>
            ))
          )}
        </div>
      </FormDialog>

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nuevo cliente"
        description="Registra la empresa para asociarla a futuras hojas de ruta."
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
                createClient(
                  {
                    name: name.trim(),
                    code: code.trim().toUpperCase(),
                    contact: contact.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                  },
                  user.id,
                );
                toast.success('Cliente registrado');
                setCreateOpen(false);
                setName('');
                setCode('');
                setContact('');
                setEmail('');
                setPhone('');
              }}
            >
              <Route /> Guardar cliente
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="client-name">Nombre de la empresa</FieldLabel>
            <Input id="client-name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="client-code">Código</FieldLabel>
            <Input id="client-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="PDV" />
          </Field>
          <Field>
            <FieldLabel htmlFor="client-contact">Contacto</FieldLabel>
            <Input id="client-contact" value={contact} onChange={(event) => setContact(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="client-email">Correo</FieldLabel>
            <Input id="client-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="client-phone">Teléfono</FieldLabel>
            <Input id="client-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </Field>
        </div>
      </FormDialog>
    </div>
  );
}
