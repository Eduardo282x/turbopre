import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import fondo from '@/assets/brand/fondo.jpg';
import { BrandLogo } from '@/components/common/brand-logo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ROLE_OPTIONS, getRoleLabel } from '@/features/preview/config';
import { DEMO_PASSWORD } from '@/features/preview/data/seed';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { getApiErrorMessage } from '@/lib/api-error';
import { authService } from '@/services/auth/auth.service';
import { useAuthStore } from '@/stores/use-auth-store';
import { loginSchema, type LoginInput } from '@turbopre/shared';

const CURRENT_YEAR = new Date().getFullYear();

export function LoginPage() {
  const currentUser = useAuthStore((state) => state.user);
  const signIn = useAuthStore((state) => state.signIn);
  const users = usePreviewStore((state) => state.db.users);
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
    mode: 'onTouched',
  });

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (username: string, password: string) => {
    setSubmitting(true);

    try {
      const response = await authService.login({ username, password });
      signIn(response);

      if (!remember) {
        useAuthStore.persist.clearStorage();
      }

      toast.success(`Bienvenido, ${response.user.name}`, {
        description: getRoleLabel(response.user.role),
      });
      navigate(from, { replace: true });
    } catch (error) {
      toast.error('No se pudo iniciar sesión', {
        description: getApiErrorMessage(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    void handleLogin(values.username.trim(), values.password);
  });

  return (
    <div
      className="relative flex min-h-svh flex-col items-center justify-center bg-zinc-950 bg-cover bg-center px-4 py-10"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="absolute inset-0 bg-[#0a0e14]/70 backdrop-blur-[3px]" aria-hidden="true" />

      <div className={`relative z-10 w-full max-w-xl`}>
        <div
          className={`grid overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/55 shadow-2xl backdrop-blur-xl`}
        >
          <section className="flex flex-col justify-between gap-8 p-7 sm:p-10">
            <div className="space-y-5">
              <BrandLogo className="h-10 brightness-0 invert" />
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
                  TurboPre Services · CAMI
                </p>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Bienvenido al sistema CAMI
                </h1>
                <p className="max-w-md text-sm leading-relaxed text-zinc-300">
                  Control Automatizado de Mantenimiento Industrial con integración de IA. Gestiona órdenes de
                  servicio, inspecciones y hojas de ruta en un solo flujo.
                </p>
              </div>
            </div>

            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <FieldGroup className="gap-4">
                <Controller
                  control={form.control}
                  name="username"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="username" className="text-zinc-200">
                        Nombre de usuario
                      </FieldLabel>
                      <Input
                        {...field}
                        id="username"
                        autoComplete="username"
                        placeholder="Ej: ana.rivas"
                        aria-invalid={fieldState.invalid}
                        className="h-11 border-white/15 bg-white/10 text-white placeholder:text-zinc-500 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/30"
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
                      <FieldLabel htmlFor="password" className="text-zinc-200">
                        Contraseña
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          aria-invalid={fieldState.invalid}
                          className="h-11 border-white/15 bg-white/10 pr-10 text-white placeholder:text-zinc-500 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/30"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-zinc-400 hover:bg-white/10 hover:text-white"
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          onClick={() => setShowPassword((value) => !value)}
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300">
                <label className="flex items-center gap-2">
                  <Checkbox checked={remember} onCheckedChange={(value) => setRemember(value === true)} />
                  Recordarme
                </label>
                <button
                  type="button"
                  className="font-medium text-cyan-300 underline-offset-4 hover:underline"
                  onClick={() => toast.info('Contacta al administrador para recuperar tu acceso.')}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="h-11 w-full bg-cyan-500 text-zinc-950 hover:bg-cyan-400"
              >
                <LogIn /> {submitting ? 'Ingresando…' : 'Iniciar sesión'}
              </Button>

            </form>
          </section>
        </div>

        <p className="mt-5 text-center text-[11px] text-white/45">
          © {CURRENT_YEAR} TurboPre Services — Automatización y trazabilidad en taller
        </p>
      </div>
    </div>
  );
}
