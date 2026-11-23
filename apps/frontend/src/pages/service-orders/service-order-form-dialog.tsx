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
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { NewServiceOrderInput, Priority, ServiceOrder } from '@/features/preview/types';
import { toDateInputValue } from '@/lib/formatters';

interface ServiceOrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: ServiceOrder;
  onSubmit: (input: NewServiceOrderInput) => void;
}

function defaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return toDateInputValue(date);
}

export function ServiceOrderFormDialog({ open, onOpenChange, order, onSubmit }: ServiceOrderFormDialogProps) {
  const db = usePreviewStore((state) => state.db);
  const [code, setCode] = useState('');
  const [subCode, setSubCode] = useState('');
  const [clientId, setClientId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [equipmentCode, setEquipmentCode] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [site, setSite] = useState('');
  const [observations, setObservations] = useState('');

  useEffect(() => {
    if (!open) return;
    const firstClient = db.clients[0];
    const firstAsset = db.assets.find((asset) => asset.clientId === firstClient?.id) ?? db.assets[0];
    setCode(order?.code ?? '');
    setSubCode(order?.subCode ?? '');
    setClientId(order?.clientId ?? firstClient?.id ?? '');
    setAssetId(order?.assetId ?? firstAsset?.id ?? '');
    setEquipmentCode(order?.equipmentCode ?? firstAsset?.tag ?? '');
    setDescription(order?.description ?? '');
    setScope(order?.scope ?? '');
    setPriority(order?.priority ?? 'MEDIUM');
    setDueDate(order ? toDateInputValue(order.dueDate) : defaultDueDate());
    setSite(order?.site ?? (firstClient ? `Planta ${firstClient.name}` : ''));
    setObservations(order?.observations ?? '');
  }, [open, order, db.clients, db.assets]);

  const clientAssets = db.assets.filter((asset) => !clientId || asset.clientId === clientId);

  const handleClientChange = (nextClientId: string) => {
    setClientId(nextClientId);
    const firstAsset = db.assets.find((asset) => asset.clientId === nextClientId);
    if (firstAsset) {
      setAssetId(firstAsset.id);
      setEquipmentCode(firstAsset.tag);
    }
    const client = db.clients.find((candidate) => candidate.id === nextClientId);
    if (client) setSite(`Planta ${client.name}`);
  };

  const submit = () => {
    if (!clientId || !assetId) {
      toast.error('Selecciona el cliente y el equipo');
      return;
    }
    if (!description.trim() || !scope.trim()) {
      toast.error('Completa la descripción y el alcance');
      return;
    }
    if (!site.trim()) {
      toast.error('Indica el sitio o planta');
      return;
    }
    onSubmit({
      code: code.trim(),
      subCode: subCode.trim(),
      clientId,
      assetId,
      equipmentCode: equipmentCode.trim(),
      description: description.trim(),
      scope: scope.trim(),
      priority,
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
      site: site.trim(),
      observations: observations.trim() || undefined,
    });
    onOpenChange(false);
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
          <Button type="button" onClick={submit}>
            {order ? 'Guardar cambios' : 'Crear orden de servicio'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="ods-code">ODS principal</FieldLabel>
            <Input
              id="ods-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Ej: 510000001915"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="ods-subcode">Sub-ODS</FieldLabel>
            <Input
              id="ods-subcode"
              value={subCode}
              onChange={(event) => setSubCode(event.target.value)}
              placeholder="Ej: 520000001658"
            />
          </Field>
          <Field>
            <FieldLabel>Cliente / empresa</FieldLabel>
            <Select value={clientId} onValueChange={handleClientChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {db.clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Equipo</FieldLabel>
            <Select
              value={assetId}
              onValueChange={(value) => {
                setAssetId(value);
                const asset = db.assets.find((candidate) => candidate.id === value);
                if (asset) setEquipmentCode(asset.tag);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un equipo" />
              </SelectTrigger>
              <SelectContent>
                {(clientAssets.length > 0 ? clientAssets : db.assets).map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.manufacturer} {asset.model} · {asset.tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="equipment-code">Código del equipo</FieldLabel>
            <Input
              id="equipment-code"
              value={equipmentCode}
              onChange={(event) => setEquipmentCode(event.target.value)}
              placeholder="Ej: TV-NG-500RC"
            />
          </Field>
          <Field>
            <FieldLabel>Prioridad</FieldLabel>
            <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Baja</SelectItem>
                <SelectItem value="MEDIUM">Media</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="CRITICAL">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="ods-site">Sitio / planta</FieldLabel>
            <Input id="ods-site" value={site} onChange={(event) => setSite(event.target.value)} />
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
            value={observations}
            onChange={(event) => setObservations(event.target.value)}
          />
        </Field>

        <p className="rounded-lg border border-info/30 bg-info/5 px-3 py-2 text-[11px] text-muted-foreground">
          Si dejas los códigos vacíos, CAMI generará un ODS principal y un sub-ODS automáticamente.
        </p>
      </div>
    </FormDialog>
  );
}
