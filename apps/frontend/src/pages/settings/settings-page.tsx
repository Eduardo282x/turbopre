import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/use-auth-store';

const profileSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.email('Ingresa un correo electrónico válido'),
});

type ProfileInput = z.infer<typeof profileSchema>;

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
    },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit((values) => {
    // Punto de partida: aquí se conectará PATCH /api/users/me cuando exista el módulo de usuarios.
    toast.success('Datos validados correctamente', {
      description: `${values.name} · ${values.email}`,
    });
  });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Ajustes del perfil</h2>
        <p className="text-sm text-muted-foreground">
          Ejemplo de formulario con react-hook-form, zod y los componentes <code>Field</code> de shadcn/ui.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
          <CardDescription>El formulario valida en el cliente y aún no persiste cambios.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit} noValidate>
          <CardContent>
            <FieldGroup>
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-name">Nombre completo</FieldLabel>
                    <Input {...field} id="profile-name" autoComplete="name" aria-invalid={fieldState.invalid} />
                    <FieldDescription>Se usará en el saludo del panel y en el menú de usuario.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-email">Correo electrónico</FieldLabel>
                    <Input
                      {...field}
                      id="profile-email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Restablecer
            </Button>
            <Button type="submit">Guardar cambios</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
