import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';
import fondo from '@/assets/brand/fondo.jpg';
import { BrandLogo } from '@/components/common/brand-logo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ROLE_BY_ID, ROLE_OPTIONS, getRoleDisplay } from '@/features/preview/config';
import { DEMO_PASSWORD } from '@/features/preview/data/seed';
import { useCurrentUser, usePreviewSession } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { getInitials } from '@/lib/formatters';
import { isPreviewMode } from '@/lib/preview';

const formSchema = z.object({
  username: z.string().min(1, 'Ingresa tu nombre de usuario'),
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
});

type FormInput = z.infer<typeof formSchema>;
const CURRENT_YEAR = new Date().getFullYear();

export function LoginPage() {
  const currentUser = useCurrentUser();
  const users = usePreviewStore((state) => state.db.users);
  const logLogin = usePreviewStore((state) => state.logLogin);
  const signIn = usePreviewSession((state) => state.signIn);
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', password: '' },
    mode: 'onTouched',
  });

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const enterAs = (userId: string) => {
    const user = users.find((candidate) => candidate.id === userId);
    if (!user) return;
    signIn(user.id);
    logLogin(user.id);
    if (!remember) {
      window.localStorage.removeItem('turbopre.preview.session');
    }
    toast.success(`Bienvenido, ${user.name}`, { description: getRoleDisplay(user) });
    navigate(from, { replace: true });
  };

  const onSubmit = form.handleSubmit((values) => {
    const user = users.find(
      (candidate) => candidate.username.toLowerCase() === values.username.trim().toLowerCase(),
    );
    if (!user) {
      toast.error('Usuario no encontrado', {
        description: 'Verifica el nombre de usuario entregado por el administrador.',
      });
      return;
    }
    if (user.password !== values.password) {
      toast.error('Contraseña incorrecta', {
        description: 'Contacta al administrador si no recuerdas tu acceso.',
      });
      return;
    }
    enterAs(user.id);
  });

  const grouped = ROLE_OPTIONS.map((role) => ({
    role,
    users: users.filter((user) => user.role === role.id),
  })).filter((group) => group.users.length > 0);

  return (
    <div
      className="relative flex min-h-svh flex-col items-center justify-center bg-zinc-950 bg-cover bg-center px-4 py-10"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="absolute inset-0 bg-[#0a0e14]/70 backdrop-blur-[3px]" aria-hidden="true" />

      <div className={`relative z-10 w-full ${isPreviewMode ? 'max-w-5xl' : 'max-w-xl'}`}>
        <div
          className={`grid overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/55 shadow-2xl backdrop-blur-xl ${
            isPreviewMode ? 'lg:grid-cols-[1.05fr_0.95fr]' : ''
          }`}
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

              <Button type="submit" className="h-11 w-full bg-cyan-500 text-zinc-950 hover:bg-cyan-400">
                <LogIn /> Iniciar sesión
              </Button>

              {isPreviewMode ? (
                <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-zinc-400">
                  <ShieldCheck className="mr-1 inline size-3.5 text-cyan-300" />
                  Modo demo/QA. Contraseña de los usuarios de prueba:{' '}
                  <span className="font-mono text-zinc-200">{DEMO_PASSWORD}</span>. En producción no se muestran
                  accesos rápidos.
                </p>
              ) : (
                <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-zinc-400">
                  <ShieldCheck className="mr-1 inline size-3.5 text-cyan-300" />
                  El acceso es creado por el administrador del sistema. No hay auto-registro.
                </p>
              )}
            </form>
          </section>

          {isPreviewMode && (
            <section className="border-t border-white/10 bg-black/20 p-6 lg:border-t-0 lg:border-l sm:p-8">
              <div className="mb-4 space-y-1">
                <p className="font-heading text-sm font-semibold text-white">Acceso rápido de QA</p>
                <p className="text-xs text-zinc-400">
                  Solo visible en desarrollo. Permite revisar la navegación y permisos de cada rol.
                </p>
              </div>
              <ScrollArea className="h-[460px] pr-3">
                <div className="space-y-5">
                  {grouped.map(({ role, users: roleUsers }) => (
                    <div key={role.id}>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {ROLE_BY_ID[role.id].label}
                      </p>
                      <div className="space-y-1">
                        {roleUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => enterAs(user.id)}
                            className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-white/10 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-[10px] font-bold text-cyan-200">
                              {getInitials(user.name)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-zinc-100">{user.name}</span>
                              <span className="block truncate text-[11px] text-zinc-400">{getRoleDisplay(user)}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </section>
          )}
        </div>

        <p className="mt-5 text-center text-[11px] text-white/45">
          © {CURRENT_YEAR} TurboPre Services — Automatización y trazabilidad en taller
        </p>
      </div>
    </div>
  );
}
