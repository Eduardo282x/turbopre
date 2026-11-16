import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FormDialog } from '@/components/common/form-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AREAS } from '@/features/preview/config';
import type { AreaId, Part } from '@/features/preview/types';

const INSPECTION_AREAS = AREAS.filter((area) =>
  [
    'turbines',
    'machining',
    'welding',
    'generators',
    'workshop',
    'quality',
    'assembly',
    'machining_major',
    'machining_minor',
    'balancing',
    'special_welding',
    'generator_shop',
    'thermal_coatings',
    'metrology',
    'field_gas',
    'field_steam',
    'field_generator',
    'field_engineering',
  ].includes(area.id),
);

interface AddInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parts: Part[];
  onSubmit: (payload: { partId: string; areaId: AreaId; description: string }) => void;
}

export function AddInspectionDialog({ open, onOpenChange, parts, onSubmit }: AddInspectionDialogProps) {
  const [partId, setPartId] = useState('');
  const [areaId, setAreaId] = useState<AreaId>('workshop');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setPartId(parts[0]?.id ?? '');
      setAreaId('workshop');
      setDescription('');
    }
  }, [open, parts]);

  const submit = () => {
    if (!partId) {
      toast.error('Selecciona la parte a inspeccionar');
      return;
    }
    if (!description.trim()) {
      toast.error('Describe el alcance de la inspección');
      return;
    }
    onSubmit({ partId, areaId, description: description.trim() });
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Agregar inspección"
      description="Crea una fase de inspección adicional dentro de la hoja de ruta."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit}>
            Crear inspección
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Parte</FieldLabel>
            <Select value={partId} onValueChange={setPartId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una parte" />
              </SelectTrigger>
              <SelectContent>
                {parts.map((part) => (
                  <SelectItem key={part.id} value={part.id}>
                    {part.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Área responsable</FieldLabel>
            <Select value={areaId} onValueChange={(value) => setAreaId(value as AreaId)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSPECTION_AREAS.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="inspection-description">Instrucciones / hallazgos esperados</FieldLabel>
          <Textarea
            id="inspection-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ej: Medir holgura del cojinete y registrar lecturas."
          />
        </Field>
      </div>
    </FormDialog>
  );
}
