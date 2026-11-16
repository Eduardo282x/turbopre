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
import { AREAS } from '@/features/preview/config';
import type { AreaId, NewSparePartInput, Part } from '@/features/preview/types';

const SPARE_AREAS = AREAS.filter((area) =>
  ['turbines', 'machining', 'welding', 'generators', 'workshop', 'engineering'].includes(area.id),
);

interface AddSparePartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parts: Part[];
  onSubmit: (input: NewSparePartInput) => void;
}

export function AddSparePartDialog({ open, onOpenChange, parts, onSubmit }: AddSparePartDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [areaId, setAreaId] = useState<AreaId>('workshop');
  const [partId, setPartId] = useState('none');

  useEffect(() => {
    if (open) {
      setName('');
      setCode('');
      setQuantity(1);
      setAreaId('workshop');
      setPartId('none');
    }
  }, [open]);

  const submit = () => {
    if (!name.trim()) {
      toast.error('Escribe el nombre del repuesto');
      return;
    }
    if (!code.trim()) {
      toast.error('Indica el código o referencia del repuesto');
      return;
    }
    onSubmit({
      name: name.trim(),
      code: code.trim(),
      quantity,
      areaId,
      partId: partId === 'none' ? undefined : partId,
    });
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Solicitar repuesto"
      description="La solicitud quedará pendiente en la bandeja de Almacén."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit}>
            Enviar solicitud
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <Field>
            <FieldLabel htmlFor="spare-name">Repuesto / material</FieldLabel>
            <Input
              id="spare-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej: Rodamiento SKF 6205"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="spare-code">Código</FieldLabel>
            <Input
              id="spare-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="RD-1001"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="spare-quantity">Cantidad</FieldLabel>
            <Input
              id="spare-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </Field>
          <Field>
            <FieldLabel>Área solicitante</FieldLabel>
            <Select value={areaId} onValueChange={(value) => setAreaId(value as AreaId)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPARE_AREAS.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Parte asociada</FieldLabel>
            <Select value={partId} onValueChange={setPartId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin parte específica</SelectItem>
                {parts.map((part) => (
                  <SelectItem key={part.id} value={part.id}>
                    {part.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    </FormDialog>
  );
}
