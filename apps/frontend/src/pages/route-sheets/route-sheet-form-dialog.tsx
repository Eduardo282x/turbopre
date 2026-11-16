import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormDialog } from '@/components/common/form-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import type { NewRouteSheetInput, RouteSheet } from '@/features/preview/types';
import { toDateInputValue } from '@/lib/formatters';

const schema = z.object({
  componentId: z.string().min(1, 'Selecciona un componente'),
  clientId: z.string().optional(),
  description: z.string().min(5, 'Describe el alcance de la hoja de ruta'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate: z.string().min(1, 'Indica la fecha compromiso'),
});

type FormValues = z.infer<typeof schema>;

interface RouteSheetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route?: RouteSheet;
  onSubmit: (input: NewRouteSheetInput) => void;
}

function defaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return toDateInputValue(date);
}

export function RouteSheetFormDialog({ open, onOpenChange, route, onSubmit }: RouteSheetFormDialogProps) {
  const components = usePreviewStore((state) => state.db.components);
  const clients = usePreviewStore((state) => state.db.clients);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      componentId: route?.componentId ?? '',
      clientId: route?.clientId ?? '',
      description: route?.description ?? '',
      priority: route?.priority ?? 'MEDIUM',
      dueDate: route ? toDateInputValue(route.dueDate) : defaultDueDate(),
    },
  });

  const handleOpenChange = (value: boolean) => {
    if (value) {
      form.reset({
        componentId: route?.componentId ?? components[0]?.id ?? '',
        clientId: route?.clientId ?? '',
        description: route?.description ?? '',
        priority: route?.priority ?? 'MEDIUM',
        dueDate: route ? toDateInputValue(route.dueDate) : defaultDueDate(),
      });
    }
    onOpenChange(value);
  };

  const submit = form.handleSubmit((values) => {
    onSubmit({
      componentId: values.componentId,
      clientId: values.clientId,
      description: values.description,
      priority: values.priority,
      dueDate: new Date(`${values.dueDate}T12:00:00`).toISOString(),
    });
    onOpenChange(false);
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={route ? 'Editar hoja de ruta' : 'Nueva hoja de ruta'}
      description={
        route
          ? 'Actualiza los datos generales del expediente.'
          : 'Crea el expediente y luego agrega partes, fases y repuestos desde el detalle.'
      }
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="route-sheet-form">
            {route ? 'Guardar cambios' : 'Crear hoja de ruta'}
          </Button>
        </>
      }
    >
      <form id="route-sheet-form" onSubmit={submit} noValidate>
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="componentId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Componente</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Selecciona un componente" />
                    </SelectTrigger>
                    <SelectContent>
                      {components.map((component) => (
                        <SelectItem key={component.id} value={component.id}>
                          {component.name} · {component.serial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Cliente</FieldLabel>
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cliente asociado</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="route-description">Descripción del alcance</FieldLabel>
                <Textarea
                  {...field}
                  id="route-description"
                  rows={3}
                  placeholder="Ej: Inspección y rehabilitación de cojinete fijo de alta presión."
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="priority"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Prioridad</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
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
              )}
            />

            <Controller
              control={form.control}
              name="dueDate"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="route-due-date">Fecha compromiso</FieldLabel>
                  <Input {...field} id="route-due-date" type="date" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </form>
    </FormDialog>
  );
}
