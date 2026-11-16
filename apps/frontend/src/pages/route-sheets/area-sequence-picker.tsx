import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AREAS, AREA_BY_ID } from '@/features/preview/config';
import type { AreaId } from '@/features/preview/types';

const SEQUENCE_AREAS = AREAS.filter((area) =>
  [
    'engineering',
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
    'projects',
  ].includes(area.id),
);

interface AreaSequencePickerProps {
  value: AreaId[];
  onChange: (value: AreaId[]) => void;
}

export function AreaSequencePicker({ value, onChange }: AreaSequencePickerProps) {
  const available = SEQUENCE_AREAS.filter((area) => !value.includes(area.id));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Secuencia de áreas
        </p>
        <Select
          value=""
          onValueChange={(areaId) => {
            if (!areaId) return;
            onChange([...value, areaId as AreaId]);
          }}
        >
          <SelectTrigger size="sm" className="w-44" disabled={available.length === 0}>
            <SelectValue placeholder="Añadir área…" />
          </SelectTrigger>
          <SelectContent>
            {available.length === 0 ? (
              <SelectItem value="none" disabled>
                Todas las áreas agregadas
              </SelectItem>
            ) : (
              available.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.shortName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {value.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          Agrega al menos un área para generar las fases de la parte.
        </p>
      ) : (
        <ol className="space-y-1.5">
          {value.map((areaId, index) => (
            <li
              key={`${areaId}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1.5"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 text-sm text-foreground">{AREA_BY_ID[areaId].name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Subir ${AREA_BY_ID[areaId].name}`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Bajar ${AREA_BY_ID[areaId].name}`}
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Quitar ${AREA_BY_ID[areaId].name}`}
                onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ol>
      )}

      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Plus className="size-3" /> Las fases se crearán en este orden y se bloquearán hasta completar la anterior.
      </p>
    </div>
  );
}
