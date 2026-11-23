import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/common/brand-logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getRoleDisplay } from '@/features/preview/config';
import { getMyTasks, getPendingApprovals, getQualityQueue, getWarehousePendingItems } from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { getInitials } from '@/lib/formatters';
import { getNavigationForRole, type NavBadge } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  className?: string;
}

export function AppSidebar({ collapsed = false, onToggleCollapse, onNavigate, className }: AppSidebarProps) {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();

  if (!user) return null;

  const groups = getNavigationForRole(user.role);
  const counts: Record<NavBadge, number> = {
    tasks: getMyTasks(db, user).length,
    approvals: getPendingApprovals(db).length,
    requests: getWarehousePendingItems(db).length,
    quality: getQualityQueue(db).length,
  };

  const handleSignOut = () => {
    signOut();
    toast.info('Sesión cerrada');
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={cn(
        'flex h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200',
        collapsed ? 'w-20' : 'w-64',
        className,
      )}
      aria-label="Navegación principal"
    >
      <div className={cn('flex h-16 items-center border-b border-sidebar-border px-3', collapsed ? 'justify-center' : 'justify-between gap-2')}>
        <Link to="/" className="min-w-0" onClick={onNavigate} aria-label="Ir al centro de control">
          {collapsed ? (
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
              TP
            </span>
          ) : (
            <BrandLogo className="h-8 max-w-40" />
          )}
        </Link>
        {!collapsed && onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            aria-label="Contraer menú"
            className="text-muted-foreground"
          >
            <PanelLeftClose />
          </Button>
        )}
      </div>

      {collapsed && onToggleCollapse && (
        <div className="flex justify-center border-b border-sidebar-border py-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            aria-label="Expandir menú"
            className="text-muted-foreground"
          >
            <PanelLeftOpen />
          </Button>
        </div>
      )}

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="mx-auto mb-1 h-px w-8 bg-sidebar-border" aria-hidden="true" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const badge = item.badge ? counts[item.badge] : 0;
                  const link = (
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
                          collapsed && 'justify-center px-0',
                          isActive && 'bg-primary/10 text-primary ring-1 ring-primary/20',
                        )
                      }
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                      {!collapsed && badge > 0 && (
                        <span className="ml-auto min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                          {badge}
                        </span>
                      )}
                      {collapsed && badge > 0 && (
                        <span className="absolute top-1 right-1.5 size-1.5 rounded-full bg-destructive" aria-hidden="true" />
                      )}
                    </NavLink>
                  );

                  if (!collapsed) {
                    return <div key={item.to}>{link}</div>;
                  }

                  return (
                    <Tooltip key={item.to}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2">
                        {item.label}
                        {badge > 0 && (
                          <span className="rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                            {badge}
                          </span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className={cn('border-t border-sidebar-border p-2', collapsed ? 'space-y-2' : 'space-y-2')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/ajustes"
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-sidebar-accent',
                collapsed && 'justify-center',
              )}
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-sidebar-foreground">{user.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{getRoleDisplay(user)}</span>
                </span>
              )}
            </Link>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">
              {user.name} · {getRoleDisplay(user)}
            </TooltipContent>
          )}
        </Tooltip>

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="mx-auto flex" aria-label="Cerrar sesión" onClick={handleSignOut}>
                <LogOut />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Cerrar sesión</TooltipContent>
          </Tooltip>
        ) : (
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
            <LogOut /> Cerrar sesión
          </Button>
        )}
      </div>
    </aside>
  );
}
