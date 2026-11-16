import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FormDialog } from '@/components/common/form-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { AreaId, NewPartInput } from '@/features/preview/types';
import { AreaSequencePicker } from './area-sequence-picker';

interface AddPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewPartInput) => void;
}

export function AddPartDialog({ open, onOpenChange, onSubmit }: AddPartDialogProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [areas, setAreas] = useState<AreaId[]>(['machining_major', 'quality']);

  useEffect(() => {
    if (open) {
      setName('');
      setQuantity(1);
      setAreas(['machining_major', 'quality']);
    }
  }, [open]);

  const submit = () => {
    if (!name.trim()) {
      toast.error('Escribe el nombre de la parte');
      return;
    }
    if (quantity < 1) {
      toast.error('La cantidad debe ser mayor a cero');
      return;
    }
    if (areas.length === 0) {
      toast.error('Agrega al menos un área a la secuencia');
      return;
    }
    onSubmit({ name: name.trim(), quantity, areas });
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Agregar parte"
      description="Define la parte y la secuencia de áreas por las que debe pasar."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit}>
            Agregar parte
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <Field>
            <FieldLabel htmlFor="part-name">Nombre de la parte</FieldLabel>
            <Input
              id="part-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej: Cojinete fijo"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="part-quantity">Cantidad</FieldLabel>
            <Input
              id="part-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </Field>
        </div>
        <AreaSequencePicker value={areas} onChange={setAreas} />
      </div>
    </FormDialog>
  );
}
