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
import {
  ASSET_TYPE_META,
  SERVICE_MODE_META,
  SERVICE_SCOPE_META,
} from '@/features/preview/config';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type {
  NewServiceOrderInput,
  Priority,
  ServiceMode,
  ServiceScope,
} from '@/features/preview/types';
import { toDateInputValue } from '@/lib/formatters';

interface ServiceOrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewServiceOrderInput) => void;
}

function defaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return toDateInputValue(date);
}

export function ServiceOrderFormDialog({ open, onOpenChange, onSubmit }: ServiceOrderFormDialogProps) {
  const db = usePreviewStore((state) => state.db);
  const [mode, setMode] = useState<ServiceMode>('SHOP');
  const [clientId, setClientId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [site, setSite] = useState('');
  const [scope, setScope] = useState<ServiceScope>('COMBUSTION_INSPECTION');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [templateId, setTemplateId] = useState('');
  const [fieldSiteName, setFieldSiteName] = useState('');
  const [fieldLocation, setFieldLocation] = useState('');
  const [fieldPermits, setFieldPermits] = useState('');
  const [fieldRisk, setFieldRisk] = useState('');
  const [fieldCrew, setFieldCrew] = useState('');
  const [fieldContainers, setFieldContainers] = useState(1);
  const [fieldCranes, setFieldCranes] = useState('Por definir');
  const [projectName, setProjectName] = useState('');
  const [supplyItemName, setSupplyItemName] = useState('');
  const [supplyItemCode, setSupplyItemCode] = useState('');
  const [supplyQuantity, setSupplyQuantity] = useState(1);

  const templatesForMode = db.serviceTemplates.filter((template) => template.mode === mode);
  const clientAssets = db.assets.filter((asset) => !clientId || asset.clientId === clientId);

  useEffect(() => {
    if (!open) return;
    const firstClient = db.clients[0];
    const firstAsset = db.assets.find((asset) => asset.clientId === firstClient?.id) ?? db.assets[0];
    const firstTemplate = db.serviceTemplates.find((template) => template.mode === 'SHOP');
    setMode('SHOP');
    setClientId(firstClient?.id ?? '');
    setAssetId(firstAsset?.id ?? '');
    setSite(firstClient ? `Planta ${firstClient.name}` : '');
    setScope(firstTemplate?.scope ?? 'SHOP_MACHINING');
    setDescription('');
    setPriority('MEDIUM');
    setDueDate(defaultDueDate());
    setTemplateId(firstTemplate?.id ?? '');
    setFieldSiteName('');
    setFieldLocation('');
    setFieldPermits('Pendiente');
    setFieldRisk('Pendiente');
    setFieldCrew('');
    setFieldContainers(1);
    setFieldCranes('Por definir');
    setProjectName('');
    setSupplyItemName('');
    setSupplyItemCode('');
    setSupplyQuantity(1);
  }, [open, db.assets, db.clients, db.serviceTemplates]);

  const handleModeChange = (nextMode: ServiceMode) => {
    setMode(nextMode);
    const firstTemplate = db.serviceTemplates.find((template) => template.mode === nextMode);
    setTemplateId(firstTemplate?.id ?? '');
    if (firstTemplate) setScope(firstTemplate.scope);
  };

  const handleClientChange = (nextClientId: string) => {
    setClientId(nextClientId);
    const firstAsset = db.assets.find((asset) => asset.clientId === nextClientId);
    if (firstAsset) setAssetId(firstAsset.id);
  };

  const submit = () => {
    if (!clientId || !assetId) {
      toast.error('Selecciona el cliente y el activo');
      return;
    }
    if (!site.trim() || !description.trim()) {
      toast.error('Completa el sitio y la descripción del alcance');
      return;
    }
    const input: NewServiceOrderInput = {
      mode,
      clientId,
      assetId,
      site: site.trim(),
      scope,
      description: description.trim(),
      priority,
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
      templateId: templateId || undefined,
      fieldSite:
        mode === 'FIELD'
          ? {
              siteName: fieldSiteName.trim() || site.trim(),
              location: fieldLocation.trim(),
              permits: fieldPermits.trim(),
              riskAnalysis: fieldRisk.trim(),
              crew: fieldCrew,
              containers: fieldContainers,
              cranes: fieldCranes.trim(),
            }
          : undefined,
      projectName: mode === 'PROJECT' ? projectName.trim() || description.trim() : undefined,
      supplyItems:
        mode === 'SUPPLY' && supplyItemName.trim()
          ? [{ name: supplyItemName.trim(), code: supplyItemCode.trim() || 'PENDIENTE', quantity: supplyQuantity }]
          : undefined,
    };
    onSubmit(input);
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nuevo expediente de servicio"
      description="Agrupa cliente, activo, alcance, modo de servicio y plan de ejecución."
      className="sm:max-w-3xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit}>
            Crear expediente
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Modo de servicio</FieldLabel>
            <Select value={mode} onValueChange={(value) => handleModeChange(value as ServiceMode)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(SERVICE_MODE_META) as ServiceMode[]).map((item) => (
                  <SelectItem key={item} value={item}>{SERVICE_MODE_META[item].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Prioridad</FieldLabel>
            <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Baja</SelectItem>
                <SelectItem value="MEDIUM">Media</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="CRITICAL">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Cliente</FieldLabel>
            <Select value={clientId} onValueChange={handleClientChange}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {db.clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Activo / equipo</FieldLabel>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona un activo" /></SelectTrigger>
              <SelectContent>
                {(clientAssets.length > 0 ? clientAssets : db.assets).map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.manufacturer} {asset.model} · {asset.tag} · {ASSET_TYPE_META[asset.type].shortLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Alcance</FieldLabel>
            <Select value={scope} onValueChange={(value) => setScope(value as ServiceScope)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(SERVICE_SCOPE_META) as ServiceScope[]).map((item) => (
                  <SelectItem key={item} value={item}>{SERVICE_SCOPE_META[item].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Plantilla de hoja de ruta</FieldLabel>
            <Select value={templateId || 'none'} onValueChange={(value) => setTemplateId(value === 'none' ? '' : value)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Sin plantilla" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin plantilla</SelectItem>
                {templatesForMode.map((template) => (
                  <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="service-site">Sitio / planta</FieldLabel>
            <Input id="service-site" value={site} onChange={(event) => setSite(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="service-due">Fecha compromiso</FieldLabel>
            <Input id="service-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="service-description">Descripción del alcance</FieldLabel>
          <Textarea
            id="service-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ej: Inspección de combustión, NDT y sustitución de componentes."
          />
        </Field>

        {mode === 'FIELD' && (
          <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
            <Field><FieldLabel htmlFor="field-site-name">Nombre del sitio</FieldLabel><Input id="field-site-name" value={fieldSiteName} onChange={(e) => setFieldSiteName(e.target.value)} /></Field>
            <Field><FieldLabel htmlFor="field-location">Ubicación</FieldLabel><Input id="field-location" value={fieldLocation} onChange={(e) => setFieldLocation(e.target.value)} /></Field>
            <Field><FieldLabel htmlFor="field-permits">Permisos</FieldLabel><Input id="field-permits" value={fieldPermits} onChange={(e) => setFieldPermits(e.target.value)} /></Field>
            <Field><FieldLabel htmlFor="field-risk">AST / análisis de riesgo</FieldLabel><Input id="field-risk" value={fieldRisk} onChange={(e) => setFieldRisk(e.target.value)} /></Field>
            <Field><FieldLabel htmlFor="field-crew">Cuadrilla (separada por comas)</FieldLabel><Input id="field-crew" value={fieldCrew} onChange={(e) => setFieldCrew(e.target.value)} /></Field>
            <Field><FieldLabel htmlFor="field-cranes">Grúas / equipos</FieldLabel><Input id="field-cranes" value={fieldCranes} onChange={(e) => setFieldCranes(e.target.value)} /></Field>
            <Field><FieldLabel htmlFor="field-containers">Contenedores</FieldLabel><Input id="field-containers" type="number" min={0} value={fieldContainers} onChange={(e) => setFieldContainers(Number(e.target.value))} /></Field>
          </div>
        )}

        {mode === 'PROJECT' && (
          <Field>
            <FieldLabel htmlFor="project-name">Nombre del proyecto</FieldLabel>
            <Input id="project-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          </Field>
        )}

        {mode === 'SUPPLY' && (
          <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-3">
            <Field><FieldLabel htmlFor="supply-name">Componente</FieldLabel><Input id="supply-name" value={supplyItemName} onChange={(e) => setSupplyItemName(e.target.value)} /></Field>
            <Field><FieldLabel htmlFor="supply-code">Código</FieldLabel><Input id="supply-code" value={supplyItemCode} onChange={(e) => setSupplyItemCode(e.target.value)} /></Field>
            <Field><FieldLabel htmlFor="supply-quantity">Cantidad</FieldLabel><Input id="supply-quantity" type="number" min={1} value={supplyQuantity} onChange={(e) => setSupplyQuantity(Number(e.target.value))} /></Field>
          </div>
        )}
      </div>
    </FormDialog>
  );
}
