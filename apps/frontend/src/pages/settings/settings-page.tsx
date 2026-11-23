import { Check, Database, LogOut, Moon, Palette, RefreshCw, Sun, UserCog } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useTheme } from '@/app/theme-context';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { PageHeader } from '@/components/common/page-header';
import { RoleBadge } from '@/components/common/role-badge';
import { SectionCard } from '@/components/common/section-card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPositionName, getRoleDisplay } from '@/features/preview/config';
import { useCurrentUser, usePreviewSession } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { getInitials } from '@/lib/formatters';
import { isPreviewMode } from '@/lib/preview';

const themes = [
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'pastel', label: 'Pastel', icon: Palette },
] as const;

export function SettingsPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const resetPreview = usePreviewStore((state) => state.resetPreview);
  const signOut = usePreviewSession((state) => state.signOut);
  const switchUser = usePreviewSession((state) => state.switchUser);
  const { theme, setTheme } = useTheme();
  const [resetOpen, setResetOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const sortedUsers = [...db.users].sort((a, b) => a.name.localeCompare(b.name, 'es'));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuración"
        title="Preferencias"
        description="Perfil, tema y datos de demostración. El rol y el puesto solo los cambia el administrador."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Perfil actual" description="Datos de la sesión.">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-lg font-bold text-primary">
              {getInitials(user.name)}
            </span>
            <div className="min-w-0 space-y-1">
              <p className="font-heading text-lg font-semibold text-foreground">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge role={user.role} positionId={user.positionId} />
                {user.positionId && (
                  <span className="text-xs text-muted-foreground">{getPositionName(user.positionId)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                signOut();
                toast.info('Sesión cerrada');
                navigate('/login', { replace: true });
              }}
            >
              <LogOut /> Cerrar sesión
            </Button>
          </div>

          {isPreviewMode && (
            <div className="mt-5 space-y-2 rounded-xl border border-info/30 bg-info/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-info">Herramienta de QA</p>
              <p className="text-[11px] text-muted-foreground">
                En desarrollo puedes cambiar de usuario para revisar cada rol. En producción este control no aparece.
              </p>
              <Select value={user.id} onValueChange={(value) => switchUser(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortedUsers.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.name} · {getRoleDisplay(candidate)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Tema de la interfaz" description="Los tres temas usan tokens semánticos y se guardan en el navegador.">
          <div className="grid gap-3 sm:grid-cols-3">
            {themes.map((option) => {
              const Icon = option.icon;
              const active = theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors ${
                    active ? 'border-primary bg-primary/10' : 'border-border/70 hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  <span className="flex w-full items-center justify-between">
                    <Icon className="size-4 text-primary" />
                    {active && <Check className="size-4 text-primary" />}
                  </span>
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">CAMI</p>
            <p>Control Automatizado de Mantenimiento Industrial con integración de IA.</p>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Datos de demostración"
        description="El preview vive en el navegador. Restablecer vuelve a la semilla original."
        actions={
          <Button variant="outline" onClick={() => setResetOpen(true)}>
            <RefreshCw /> Restablecer datos
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Órdenes de servicio', value: db.serviceOrders.length },
            { label: 'Inspecciones', value: db.inspections.length },
            { label: 'Hojas de ruta', value: db.routeSheets.length },
            { label: 'Tareas', value: db.tasks.length },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="font-heading text-2xl font-bold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-info/30 bg-info/5 p-3 text-xs leading-relaxed text-muted-foreground">
          <Database className="mt-0.5 size-4 shrink-0 text-info" />
          <p>
            Los cambios se guardan en <code>localStorage</code>. Al restablecer se descartan los datos locales y se
            carga de nuevo la semilla de demostración.
          </p>
        </div>
      </SectionCard>

      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
        <UserCog className="size-4 shrink-0" />
        <p>
          El administrador crea los usuarios y asigna su rol y puesto. Los usuarios no pueden cambiar su propio rol.
        </p>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Restablecer datos de demostración"
        description="Se descartarán todos los cambios locales y se cargarán de nuevo las órdenes, inspecciones, hojas y tareas de ejemplo."
        confirmLabel="Sí, restablecer"
        destructive
        onConfirm={() => {
          resetPreview();
          toast.success('Datos de demostración restablecidos');
        }}
      />
    </div>
  );
}
