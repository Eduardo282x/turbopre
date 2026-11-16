import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { LuDatabase, LuShieldCheck, LuZap } from 'react-icons/lu';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { type LoginInput, loginSchema } from '@turbopre/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api-error';
import { authService } from '@/services/auth/auth.service';
import { useAuthStore } from '@/stores/use-auth-store';

const highlights = [
  { icon: LuZap, text: 'Vite + React 19 con recarga instantánea' },
  { icon: LuDatabase, text: 'API NestJS + Prisma lista para PostgreSQL' },
  { icon: LuShieldCheck, text: 'JWT, zustand y rutas protegidas' },
];

const currentYear = new Date().getFullYear();

export function LoginPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const signIn = useAuthStore((state) => state.signIn);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: ({ accessToken: token, user }) => {
      signIn({ accessToken: token, user });
      toast.success(`Bienvenido, ${user.name}`);
      navigate(from, { replace: true });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No pudimos iniciar sesión'));
    },
  });

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between bg-zinc-950 p-10 text-zinc-100 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-sm font-bold text-zinc-900">
            TP
          </div>
          <span className="text-lg font-semibold tracking-tight">TurboPre</span>
        </div>

        <div className="max-w-md space-y-6">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Un monorepo, dos aplicaciones, cero fricción.
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400">
            Frontend en React con Vite, Tailwind y shadcn/ui. Backend en NestJS con Prisma y PostgreSQL.
            Orquestado con Turborepo y pnpm.
          </p>
          <ul className="space-y-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 ring-1 ring-zinc-800">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-zinc-500">© {currentYear} TurboPre</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Inicia sesión</CardTitle>
            <CardDescription>Accede al panel con tus credenciales de TurboPre.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={onSubmit} noValidate>
              <FieldGroup className="gap-4">
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="admin@turbopre.dev"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Ingresando…' : 'Ingresar'}
                </Button>
              </FieldGroup>
            </form>

            <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">Modo demo (sin base de datos)</p>
              <p>
                admin@turbopre.dev · Admin123!
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="mt-1 h-auto p-0 text-xs"
                onClick={() => {
                  form.setValue('email', 'admin@turbopre.dev', { shouldValidate: true });
                  form.setValue('password', 'Admin123!', { shouldValidate: true });
                }}
              >
                Rellenar credenciales demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
