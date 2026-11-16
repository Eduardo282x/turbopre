import { Check, Database, Moon, Palette, RefreshCw, Sun, UserCog } from 'lucide-react';
import { useTheme } from '@/app/theme-context';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { RoleBadge } from '@/components/common/role-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { PageHeader } from '@/components/common/page-header';
import { SectionCard } from '@/components/common/section-card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAreaName, getRoleDisplay } from '@/features/preview/config';
import { useCurrentUser, usePreviewSession } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { getInitials } from '@/lib/formatters';

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
        eyebrow="Administración"
        title="Configuración"
        description="Perfil, tema, datos de prueba y preferencias del modo preview."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Perfil actual" description="Datos de la sesión de demostración.">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-lg font-bold text-primary">
              {getInitials(user.name)}
            </span>
            <div className="min-w-0 space-y-1">
              <p className="font-heading text-lg font-semibold text-foreground">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge role={user.role} areaId={user.areaId} />
                <span className="text-xs text-muted-foreground">
                  {user.areaId ? getAreaName(user.areaId) : 'Acceso global'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cambiar usuario de preview
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
            <p className="text-[11px] text-muted-foreground">
              El cambio de usuario solo afecta al preview local; no hay autenticación real.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { signOut(); toast.info('Sesión cerrada'); navigate('/login', { replace: true }); }}>
              Cerrar sesión
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">
                <UserCog /> Ir al login
              </Link>
            </Button>
          </div>
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
            <p className="font-medium text-foreground">Nota</p>
            <p>
              El tema pastel usa una paleta cálida. El modo oscuro es la vista industrial principal del
              mockup. Puedes cambiarlo también desde el selector del encabezado.
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Datos de prueba"
        description="Todo el contenido del preview vive en el navegador y se puede restablecer."
        actions={
          <Button variant="outline" onClick={() => setResetOpen(true)}>
            <RefreshCw /> Restablecer datos
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Hojas de ruta', value: db.routeSheets.length },
            { label: 'Partes', value: db.parts.length },
            { label: 'Fases', value: db.phases.length },
            { label: 'Eventos de auditoría', value: db.audit.length },
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
            El preview no se conecta al backend. Los cambios se guardan en <code>localStorage</code> para
            que puedas navegar entre pantallas y se pierden al restablecer los datos.
          </p>
        </div>
      </SectionCard>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Restablecer datos de prueba"
        description="Se descartarán todos los cambios locales y se cargarán de nuevo las hojas, usuarios, inventario y auditoría de ejemplo."
        confirmLabel="Sí, restablecer"
        destructive
        onConfirm={() => {
          resetPreview();
          toast.success('Datos de prueba restablecidos');
        }}
      />
    </div>
  );
}
