import { useEffect, useState } from 'react';
import { PackagePlus, Plus, Trash2 } from 'lucide-react';
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
import type { NewSpareItemInput, NewSpareRequestInput } from '@/features/preview/types';

interface SpareRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewSpareRequestInput) => void;
}

interface Row extends NewSpareItemInput {
  key: string;
}

function rowKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

function emptyRow(): Row {
  return { key: rowKey(), name: '', code: '', quantity: 1 };
}

export function SpareRequestDialog({ open, onOpenChange, onSubmit }: SpareRequestDialogProps) {
  const inventory = usePreviewStore((state) => state.db.inventory);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [notes, setNotes] = useState('');
  const [selectedInventory, setSelectedInventory] = useState('none');

  useEffect(() => {
    if (open) {
      setRows([emptyRow()]);
      setNotes('');
      setSelectedInventory('none');
    }
  }, [open]);

  const update = (key: string, patch: Partial<Row>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const addFromInventory = (itemId: string) => {
    setSelectedInventory(itemId);
    if (itemId === 'none') return;
    const item = inventory.find((candidate) => candidate.id === itemId);
    if (!item) return;
    setRows((current) => [
      ...current.filter((row) => row.name.trim() || row.code.trim()),
      { key: rowKey(), name: item.name, code: item.code, quantity: 1 },
    ]);
    setSelectedInventory('none');
  };

  const submit = () => {
    const items = rows
      .filter((row) => row.name.trim() && row.code.trim())
      .map(({ name, code, quantity }) => ({ name: name.trim(), code: code.trim(), quantity: Math.max(1, quantity) }));
    if (items.length === 0) {
      toast.error('Agrega al menos un repuesto con nombre y código');
      return;
    }
    onSubmit({ items, notes: notes.trim() || undefined });
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Solicitar repuestos"
      description="Puedes pedir varios materiales en una sola solicitud. Si no hay stock, se envía a Procura."
      className="sm:max-w-4xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit}>
            <PackagePlus /> Enviar solicitud
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border/70 bg-muted/20 p-3">
          <Field className="min-w-64 flex-1">
            <FieldLabel>Agregar desde inventario</FieldLabel>
            <Select value={selectedInventory} onValueChange={addFromInventory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un ítem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Selecciona un ítem</SelectItem>
                {inventory.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} · {item.code} · {item.quantity} disponible(s)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRows((current) => [...current, emptyRow()])}
          >
            <Plus /> Línea manual
          </Button>
        </div>

        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={row.key} className="grid gap-3 rounded-xl border border-border/70 p-3 sm:grid-cols-[1fr_180px_100px_40px]">
              <Field>
                <FieldLabel>Repuesto / material</FieldLabel>
                <Input
                  value={row.name}
                  onChange={(event) => update(row.key, { name: event.target.value })}
                  placeholder="Ej: Rodamiento SKF 6205"
                />
              </Field>
              <Field>
                <FieldLabel>Código</FieldLabel>
                <Input
                  value={row.code}
                  onChange={(event) => update(row.key, { code: event.target.value })}
                  placeholder="RD-1001"
                />
              </Field>
              <Field>
                <FieldLabel>Cantidad</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(event) => update(row.key, { quantity: Number(event.target.value) || 1 })}
                />
              </Field>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setRows((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                  aria-label={`Eliminar línea ${index + 1}`}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Field>
          <FieldLabel htmlFor="spare-notes">Observaciones (opcional)</FieldLabel>
          <Textarea
            id="spare-notes"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ej: Material requerido para la reparación de la biela."
          />
        </Field>
      </div>
    </FormDialog>
  );
}
