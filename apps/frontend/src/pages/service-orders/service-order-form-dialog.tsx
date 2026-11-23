import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FormDialog } from '@/components/common/form-dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { useClients, useEquipment, useProjects, useSites } from '@/hooks/use-commercial-data';
import { toDateInputValue } from '@/lib/formatters';
import type {
  CreateServiceOrderInput,
  Priority,
  ServiceOrderRecord,
} from '@turbopre/shared';

interface ServiceOrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: ServiceOrderRecord;
  pending?: boolean;
  onSubmit: (input: CreateServiceOrderInput) => void;
}

function defaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return toDateInputValue(date);
}

const PRIORITIES: Array<{ value: Priority; label: string }> = [
  { value: 'LOW', label: 'Baja' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'CRITICAL', label: 'Crítica' },
];

export function ServiceOrderFormDialog({
  open,
  onOpenChange,
  order,
  pending = false,
  onSubmit,
}: ServiceOrderFormDialogProps) {
  const clientsQuery = useClients();
  const sitesQuery = useSites();
  const equipmentQuery = useEquipment();
  const projectsQuery = useProjects();

  const [clientId, setClientId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [projectId, setProjectId] = useState('none');
  const [notes, setNotes] = useState('');

  const clients = clientsQuery.data ?? [];
  const sites = sitesQuery.data ?? [];
  const equipment = equipmentQuery.data ?? [];
  const projects = projectsQuery.data ?? [];

  const clientSites = sites.filter((site) => site.clientId === clientId);
  const clientEquipment = equipment.filter((item) => item.clientId === clientId);
  const clientProjects = projects.filter(
    (project) => !project.clientId || project.clientId === clientId,
  );

  useEffect(() => {
    if (!open) return;

    if (order) {
      setClientId(order.client.id);
      setSiteId(order.site.id);
      setEquipmentId(order.equipment.id);
      setDescription(order.description);
      setScope(order.scope);
      setPriority(order.priority);
      setDueDate(order.dueAt ? toDateInputValue(order.dueAt) : defaultDueDate());
      setProjectId(order.project?.id ?? 'none');
      setNotes(order.notes ?? '');
      return;
    }

    setClientId(clients[0]?.id ?? '');
    setSiteId('');
    setEquipmentId('');
    setDescription('');
    setScope('');
    setPriority('MEDIUM');
    setDueDate(defaultDueDate());
    setProjectId('none');
    setNotes('');
  }, [open, order, clients]);

  useEffect(() => {
    if (!open || !clientId) return;
    if (sitesQuery.isLoading || equipmentQuery.isLoading) return;

    if (!clientSites.some((site) => site.id === siteId)) {
      setSiteId(clientSites[0]?.id ?? '');
    }

    if (!clientEquipment.some((item) => item.id === equipmentId)) {
      setEquipmentId(clientEquipment[0]?.id ?? '');
    }
  }, [
    open,
    clientId,
    clientSites,
    clientEquipment,
    siteId,
    equipmentId,
    sitesQuery.isLoading,
    equipmentQuery.isLoading,
  ]);

  const handleClientChange = (nextClientId: string) => {
    setClientId(nextClientId);
    setSiteId(sites.find((site) => site.clientId === nextClientId)?.id ?? '');
    setEquipmentId(
      equipment.find((item) => item.clientId === nextClientId)?.id ?? '',
    );
    setProjectId('none');
  };

  const submit = () => {
    if (!clientId || !siteId || !equipmentId) {
      toast.error('Selecciona el cliente, el sitio y el equipo');
      return;
    }

    if (!description.trim() || !scope.trim()) {
      toast.error('Completa la descripción y el alcance');
      return;
    }

    onSubmit({
      clientId,
      siteId,
      equipmentId,
      description: description.trim(),
      scope: scope.trim(),
      priority,
      dueAt: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null,
      projectId: projectId === 'none' ? null : projectId,
      parentServiceOrderId: null,
      notes: notes.trim() || null,
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={order ? 'Editar orden de servicio' : 'Nueva orden de servicio'}
      description="Ventas crea la ODS. Al guardarla, Taller e Ingeniería la reciben automáticamente."
      className="sm:max-w-3xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? 'Guardando…' : order ? 'Guardar cambios' : 'Crear orden de servicio'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Cliente / empresa</FieldLabel>
            <Select value={clientId} onValueChange={handleClientChange}>
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
            <FieldLabel>Sitio / planta</FieldLabel>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un sitio" />
              </SelectTrigger>
              <SelectContent>
                {clientSites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Equipo</FieldLabel>
            <Select value={equipmentId} onValueChange={setEquipmentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un equipo" />
              </SelectTrigger>
              <SelectContent>
                {clientEquipment.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.code} · {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Proyecto (opcional)</FieldLabel>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin proyecto</SelectItem>
                {clientProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.code} · {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Prioridad</FieldLabel>
            <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="ods-due">Fecha compromiso</FieldLabel>
            <Input
              id="ods-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="ods-description">Descripción</FieldLabel>
          <Textarea
            id="ods-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ej: T- DESARME, LIMPIEZA E INSPECCIÓN DE TURBINA A VAPOR..."
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="ods-scope">Alcance</FieldLabel>
          <Textarea
            id="ods-scope"
            rows={2}
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            placeholder="Ej: Desarme, limpieza, inspección y reparación de biela."
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="ods-observations">Observaciones (opcional)</FieldLabel>
          <Textarea
            id="ods-observations"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>

        {clientId && clientSites.length === 0 && (
          <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-[11px] text-muted-foreground">
            Este cliente no tiene sitios registrados. Crea uno desde Clientes → Sitios.
          </p>
        )}

        {clientId && clientEquipment.length === 0 && (
          <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-[11px] text-muted-foreground">
            Este cliente no tiene equipos registrados. Crea uno desde Clientes → Equipos.
          </p>
        )}

        <p className="rounded-lg border border-info/30 bg-info/5 px-3 py-2 text-[11px] text-muted-foreground">
          El número de ODS lo genera el sistema al guardar.
        </p>
      </div>
    </FormDialog>
  );
}
