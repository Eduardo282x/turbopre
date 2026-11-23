import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Eye,
  Factory,
  MapPin,
  PackageSearch,
  Pencil,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { EquipmentTypeBadge, ServiceOrderStatusBadge } from '@/components/common/badges';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { EQUIPMENT_TYPE_META } from '@/features/preview/config';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { useClients, useEquipment, useServiceOrders, useSites } from '@/hooks/use-commercial-data';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/formatters';
import {
  canManageClients as canManageClientsByRole,
  canManageEquipment as canManageEquipmentByRole,
  canManageSites as canManageSitesByRole,
} from '@turbopre/shared';
import type {
  ClientRecord,
  CreateClientInput,
  CreateEquipmentInput,
  CreateSiteInput,
  EquipmentRecord,
  EquipmentType,
  SiteRecord,
} from '@turbopre/shared';
import { clientsService } from '@/services/clients/clients.service';
import { equipmentService } from '@/services/equipment/equipment.service';
import { sitesService } from '@/services/sites/sites.service';

export function ClientsPage() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const clientsQuery = useClients();
  const sitesQuery = useSites();
  const equipmentQuery = useEquipment();
  const ordersQuery = useServiceOrders();

  const [activeTab, setActiveTab] = useState('clients');
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);

  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  const [siteFormOpen, setSiteFormOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteRecord | null>(null);
  const [siteClientId, setSiteClientId] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');

  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentRecord | null>(null);
  const [equipmentClientId, setEquipmentClientId] = useState('');
  const [equipmentCode, setEquipmentCode] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('AUXILIARY');
  const [equipmentManufacturer, setEquipmentManufacturer] = useState('');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [equipmentSerial, setEquipmentSerial] = useState('');
  const [equipmentNotes, setEquipmentNotes] = useState('');

  const invalidateCommercial = () => {
    void queryClient.invalidateQueries({ queryKey: ['clients'] });
    void queryClient.invalidateQueries({ queryKey: ['sites'] });
    void queryClient.invalidateQueries({ queryKey: ['equipment'] });
    void queryClient.invalidateQueries({ queryKey: ['service-orders'] });
  };

  const saveClient = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CreateClientInput }) =>
      id ? clientsService.update(id, input) : clientsService.create(input),
    onSuccess: (client) => {
      invalidateCommercial();
      toast.success(editingClient ? 'Cliente actualizado' : 'Cliente registrado', {
        description: client.name,
      });
      setClientFormOpen(false);
    },
    onError: (error) =>
      toast.error('No se pudo guardar el cliente', {
        description: getApiErrorMessage(error),
      }),
  });

  const saveSite = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CreateSiteInput }) =>
      id ? sitesService.update(id, input) : sitesService.create(input),
    onSuccess: (site) => {
      invalidateCommercial();
      toast.success(editingSite ? 'Sitio actualizado' : 'Sitio registrado', {
        description: site.name,
      });
      setSiteFormOpen(false);
    },
    onError: (error) =>
      toast.error('No se pudo guardar el sitio', {
        description: getApiErrorMessage(error),
      }),
  });

  const saveEquipment = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CreateEquipmentInput }) =>
      id ? equipmentService.update(id, input) : equipmentService.create(input),
    onSuccess: (equipment) => {
      invalidateCommercial();
      toast.success(editingEquipment ? 'Equipo actualizado' : 'Equipo registrado', {
        description: `${equipment.code} · ${equipment.name}`,
      });
      setEquipmentFormOpen(false);
    },
    onError: (error) =>
      toast.error('No se pudo guardar el equipo', {
        description: getApiErrorMessage(error),
      }),
  });

  if (!user) return null;

  const clients = clientsQuery.data ?? [];
  const sites = sitesQuery.data ?? [];
  const equipment = equipmentQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const canManageClients = canManageClientsByRole(user.role);
  const canManageSites = canManageSitesByRole(user.role);
  const canManageEquipment = canManageEquipmentByRole(user.role);

  const openClientForm = (client?: ClientRecord) => {
    setEditingClient(client ?? null);
    setClientName(client?.name ?? '');
    setClientCode(client?.code ?? '');
    setClientContact(client?.contactName ?? '');
    setClientEmail(client?.contactEmail ?? '');
    setClientPhone(client?.contactPhone ?? '');
    setClientAddress(client?.address ?? '');
    setClientFormOpen(true);
  };

  const openSiteForm = (site?: SiteRecord) => {
    setEditingSite(site ?? null);
    setSiteClientId(site?.clientId ?? clients[0]?.id ?? '');
    setSiteName(site?.name ?? '');
    setSiteAddress(site?.address ?? '');
    setSiteFormOpen(true);
  };

  const openEquipmentForm = (item?: EquipmentRecord) => {
    setEditingEquipment(item ?? null);
    setEquipmentClientId(item?.clientId ?? clients[0]?.id ?? '');
    setEquipmentCode(item?.code ?? '');
    setEquipmentName(item?.name ?? '');
    setEquipmentType(item?.type ?? 'AUXILIARY');
    setEquipmentManufacturer(item?.manufacturer ?? '');
    setEquipmentModel(item?.model ?? '');
    setEquipmentSerial(item?.serialNumber ?? '');
    setEquipmentNotes(item?.notes ?? '');
    setEquipmentFormOpen(true);
  };

  const submitClient = () => {
    if (!clientName.trim() || !clientCode.trim()) {
      toast.error('El nombre y el código son obligatorios');
      return;
    }

    saveClient.mutate({
      id: editingClient?.id,
      input: {
        name: clientName.trim(),
        code: clientCode.trim(),
        contactName: clientContact.trim() || null,
        contactEmail: clientEmail.trim() || null,
        contactPhone: clientPhone.trim() || null,
        address: clientAddress.trim() || null,
      },
    });
  };

  const submitSite = () => {
    if (!siteClientId || !siteName.trim()) {
      toast.error('Selecciona el cliente e indica el nombre del sitio');
      return;
    }

    saveSite.mutate({
      id: editingSite?.id,
      input: {
        clientId: siteClientId,
        name: siteName.trim(),
        address: siteAddress.trim() || null,
      },
    });
  };

  const submitEquipment = () => {
    if (!equipmentClientId || !equipmentCode.trim() || !equipmentName.trim()) {
      toast.error('Selecciona el cliente e indica código y nombre del equipo');
      return;
    }

    saveEquipment.mutate({
      id: editingEquipment?.id,
      input: {
        clientId: equipmentClientId,
        code: equipmentCode.trim(),
        name: equipmentName.trim(),
        type: equipmentType,
        manufacturer: equipmentManufacturer.trim() || null,
        model: equipmentModel.trim() || null,
        serialNumber: equipmentSerial.trim() || null,
        notes: equipmentNotes.trim() || null,
      },
    });
  };

  const selectedOrders = selectedClient
    ? orders.filter((order) => order.client.id === selectedClient.id)
    : [];

  const clientColumns: DataTableColumn<ClientRecord>[] = [
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
          <p className="text-foreground">{client.contactName ?? '—'}</p>
          <p className="text-muted-foreground">{client.contactEmail ?? '—'}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'phone',
      header: 'Teléfono',
      cell: (client) => (
        <span className="text-xs text-muted-foreground">{client.contactPhone ?? '—'}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'master',
      header: 'Maestros',
      cell: (client) => (
        <div className="text-xs">
          <p className="text-foreground">
            {client.siteCount} sitios · {client.equipmentCount} equipos
          </p>
          <p className="text-muted-foreground">
            {client.activeServiceOrderCount} ODS activas de {client.serviceOrderCount}
          </p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'created',
      header: 'Registro',
      cell: (client) => (
        <span className="text-xs text-muted-foreground">{formatDate(client.createdAt)}</span>
      ),
      hideOnMobile: true,
      sortable: true,
      sortValue: (client) => new Date(client.createdAt),
    },
  ];

  const siteColumns: DataTableColumn<SiteRecord>[] = [
    {
      id: 'site',
      header: 'Sitio / planta',
      cell: (site) => (
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-info/10 text-info">
            <MapPin className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{site.name}</p>
            <p className="text-xs text-muted-foreground">{site.clientName}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (site) => site.name,
    },
    {
      id: 'client',
      header: 'Cliente',
      cell: (site) => <span className="text-sm">{site.clientName}</span>,
      hideOnMobile: true,
    },
    {
      id: 'address',
      header: 'Dirección',
      cell: (site) => (
        <span className="text-xs text-muted-foreground">{site.address ?? '—'}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'orders',
      header: 'ODS',
      cell: (site) => <span className="text-xs">{site.serviceOrderCount} órdenes</span>,
      hideOnMobile: true,
    },
  ];

  const equipmentColumns: DataTableColumn<EquipmentRecord>[] = [
    {
      id: 'equipment',
      header: 'Equipo',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Factory className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{item.name}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{item.code}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (item) => item.name,
    },
    {
      id: 'client',
      header: 'Cliente',
      cell: (item) => <span className="text-sm">{item.clientName}</span>,
      hideOnMobile: true,
    },
    {
      id: 'type',
      header: 'Tipo',
      cell: (item) => <EquipmentTypeBadge type={item.type} />,
      sortable: true,
      sortValue: (item) => EQUIPMENT_TYPE_META[item.type].label,
    },
    {
      id: 'model',
      header: 'Fabricante / modelo',
      cell: (item) => (
        <div className="text-xs">
          <p className="text-foreground">
            {item.manufacturer ?? '—'} {item.model ?? ''}
          </p>
          <p className="text-muted-foreground">Serial: {item.serialNumber ?? '—'}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'orders',
      header: 'ODS',
      cell: (item) => <span className="text-xs">{item.serviceOrderCount} órdenes</span>,
      hideOnMobile: true,
    },
  ];

  const headerActions =
    activeTab === 'clients' && canManageClients ? (
      <Button onClick={() => openClientForm()}>
        <Plus /> Nuevo cliente
      </Button>
    ) : activeTab === 'sites' && canManageSites ? (
      <Button onClick={() => openSiteForm()}>
        <Plus /> Nuevo sitio
      </Button>
    ) : activeTab === 'equipment' && canManageEquipment ? (
      <Button onClick={() => openEquipmentForm()}>
        <Plus /> Nuevo equipo
      </Button>
    ) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comercial"
        title="Clientes y equipos"
        description="Cartera comercial, sitios/plantas y equipos asociados a las órdenes de servicio."
        actions={headerActions}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Clientes"
          value={clients.length}
          hint="Empresas registradas"
          icon={Building2}
          tone="accent"
        />
        <KpiCard
          label="Sitios"
          value={sites.length}
          hint="Plantas y ubicaciones"
          icon={MapPin}
          tone="info"
        />
        <KpiCard
          label="Equipos"
          value={equipment.length}
          hint="Maestro de equipos"
          icon={Factory}
          tone="success"
        />
        <KpiCard
          label="ODS"
          value={orders.length}
          hint="Órdenes de servicio"
          icon={PackageSearch}
          tone="warning"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="sites">Sitios</TabsTrigger>
          <TabsTrigger value="equipment">Equipos</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-4">
          <DataTable
            data={clients}
            columns={clientColumns}
            getRowId={(client) => client.id}
            isLoading={clientsQuery.isLoading}
            search={{
              placeholder: 'Buscar por empresa, código o contacto…',
              getText: (client) =>
                `${client.name} ${client.code} ${client.contactName ?? ''} ${client.contactEmail ?? ''}`,
            }}
            actions={[
              {
                label: 'Ver detalle',
                icon: Eye,
                onSelect: (client) => setSelectedClient(client),
              },
              {
                label: 'Editar',
                icon: Pencil,
                hidden: () => !canManageClients,
                onSelect: (client) => openClientForm(client),
              },
            ]}
            onRowClick={(client) => setSelectedClient(client)}
            pageSize={10}
            emptyTitle="Sin clientes"
            emptyDescription="Registra el primer cliente para asociarlo a una orden de servicio."
            caption="Cartera de clientes"
          />
        </TabsContent>

        <TabsContent value="sites" className="mt-4">
          <DataTable
            data={sites}
            columns={siteColumns}
            getRowId={(site) => site.id}
            isLoading={sitesQuery.isLoading}
            search={{
              placeholder: 'Buscar por sitio, cliente o dirección…',
              getText: (site) =>
                `${site.name} ${site.clientName} ${site.address ?? ''}`,
            }}
            actions={[
              {
                label: 'Editar',
                icon: Pencil,
                hidden: () => !canManageSites,
                onSelect: (site) => openSiteForm(site),
              },
            ]}
            pageSize={10}
            emptyTitle="Sin sitios"
            emptyDescription="Registra una planta o ubicación para un cliente."
            caption="Sitios y plantas"
          />
        </TabsContent>

        <TabsContent value="equipment" className="mt-4">
          <DataTable
            data={equipment}
            columns={equipmentColumns}
            getRowId={(item) => item.id}
            isLoading={equipmentQuery.isLoading}
            search={{
              placeholder: 'Buscar por código, equipo, fabricante o serial…',
              getText: (item) =>
                `${item.code} ${item.name} ${item.clientName} ${item.manufacturer ?? ''} ${item.model ?? ''} ${item.serialNumber ?? ''}`,
            }}
            actions={[
              {
                label: 'Editar',
                icon: Pencil,
                hidden: () => !canManageEquipment,
                onSelect: (item) => openEquipmentForm(item),
              },
            ]}
            pageSize={10}
            emptyTitle="Sin equipos"
            emptyDescription="Registra el primer equipo de un cliente."
            caption="Maestro de equipos"
          />
        </TabsContent>
      </Tabs>

      <FormDialog
        open={clientFormOpen}
        onOpenChange={setClientFormOpen}
        title={editingClient ? 'Editar cliente' : 'Nuevo cliente'}
        description="Datos comerciales de la empresa. El código debe ser único."
        footer={
          <>
            <Button variant="outline" onClick={() => setClientFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitClient} disabled={saveClient.isPending}>
              <Plus /> {saveClient.isPending ? 'Guardando…' : 'Guardar cliente'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="client-name">Nombre de la empresa</FieldLabel>
            <Input
              id="client-name"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="client-code">Código</FieldLabel>
            <Input
              id="client-code"
              value={clientCode}
              onChange={(event) => setClientCode(event.target.value)}
              placeholder="CALP"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="client-contact">Contacto</FieldLabel>
            <Input
              id="client-contact"
              value={clientContact}
              onChange={(event) => setClientContact(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="client-email">Correo</FieldLabel>
            <Input
              id="client-email"
              type="email"
              value={clientEmail}
              onChange={(event) => setClientEmail(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="client-phone">Teléfono</FieldLabel>
            <Input
              id="client-phone"
              value={clientPhone}
              onChange={(event) => setClientPhone(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="client-address">Dirección</FieldLabel>
            <Input
              id="client-address"
              value={clientAddress}
              onChange={(event) => setClientAddress(event.target.value)}
            />
          </Field>
        </div>
      </FormDialog>

      <FormDialog
        open={siteFormOpen}
        onOpenChange={setSiteFormOpen}
        title={editingSite ? 'Editar sitio' : 'Nuevo sitio'}
        description="Planta o ubicación del cliente donde se ejecuta el servicio."
        footer={
          <>
            <Button variant="outline" onClick={() => setSiteFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitSite} disabled={saveSite.isPending}>
              <Plus /> {saveSite.isPending ? 'Guardando…' : 'Guardar sitio'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Cliente</FieldLabel>
            <Select value={siteClientId} onValueChange={setSiteClientId} disabled={Boolean(editingSite)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="site-name">Nombre del sitio</FieldLabel>
            <Input
              id="site-name"
              value={siteName}
              onChange={(event) => setSiteName(event.target.value)}
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="site-address">Dirección</FieldLabel>
            <Input
              id="site-address"
              value={siteAddress}
              onChange={(event) => setSiteAddress(event.target.value)}
            />
          </Field>
        </div>
      </FormDialog>

      <FormDialog
        open={equipmentFormOpen}
        onOpenChange={setEquipmentFormOpen}
        title={editingEquipment ? 'Editar equipo' : 'Nuevo equipo'}
        description="Maestro de equipos del cliente. El código/tag es único por cliente."
        footer={
          <>
            <Button variant="outline" onClick={() => setEquipmentFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitEquipment} disabled={saveEquipment.isPending}>
              <Plus /> {saveEquipment.isPending ? 'Guardando…' : 'Guardar equipo'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Cliente</FieldLabel>
            <Select
              value={equipmentClientId}
              onValueChange={setEquipmentClientId}
              disabled={Boolean(editingEquipment)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Tipo de equipo</FieldLabel>
            <Select
              value={equipmentType}
              onValueChange={(value) => setEquipmentType(value as EquipmentType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(EQUIPMENT_TYPE_META) as EquipmentType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {EQUIPMENT_TYPE_META[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="equipment-code">Código / tag</FieldLabel>
            <Input
              id="equipment-code"
              value={equipmentCode}
              onChange={(event) => setEquipmentCode(event.target.value)}
              placeholder="TV-101"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="equipment-name">Nombre del equipo</FieldLabel>
            <Input
              id="equipment-name"
              value={equipmentName}
              onChange={(event) => setEquipmentName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="equipment-manufacturer">Fabricante</FieldLabel>
            <Input
              id="equipment-manufacturer"
              value={equipmentManufacturer}
              onChange={(event) => setEquipmentManufacturer(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="equipment-model">Modelo</FieldLabel>
            <Input
              id="equipment-model"
              value={equipmentModel}
              onChange={(event) => setEquipmentModel(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="equipment-serial">Serial</FieldLabel>
            <Input
              id="equipment-serial"
              value={equipmentSerial}
              onChange={(event) => setEquipmentSerial(event.target.value)}
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="equipment-notes">Notas</FieldLabel>
            <Textarea
              id="equipment-notes"
              rows={2}
              value={equipmentNotes}
              onChange={(event) => setEquipmentNotes(event.target.value)}
            />
          </Field>
        </div>
      </FormDialog>

      <FormDialog
        open={Boolean(selectedClient)}
        onOpenChange={(open) => {
          if (!open) setSelectedClient(null);
        }}
        title={selectedClient ? selectedClient.name : 'Cliente'}
        description="Sitios, equipos y órdenes de servicio asociadas."
        className="sm:max-w-3xl"
        footer={
          <Button variant="outline" onClick={() => setSelectedClient(null)}>
            Cerrar
          </Button>
        }
      >
        {selectedClient && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Contacto</p>
                <p className="mt-1 text-sm font-medium">{selectedClient.contactName ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{selectedClient.contactEmail ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{selectedClient.contactPhone ?? '—'}</p>
              </div>
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sitios</p>
                <p className="mt-1 text-2xl font-bold">{selectedClient.siteCount}</p>
              </div>
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Equipos</p>
                <p className="mt-1 text-2xl font-bold">{selectedClient.equipmentCount}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Órdenes de servicio
              </p>
              {selectedOrders.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Este cliente todavía no tiene órdenes de servicio.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/ordenes-servicio/${order.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium text-foreground">{order.orderNumber}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {order.equipment.code} · {order.equipment.name}
                        </span>
                      </span>
                      <ServiceOrderStatusBadge status={order.workflowStatus} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </FormDialog>
    </div>
  );
}
