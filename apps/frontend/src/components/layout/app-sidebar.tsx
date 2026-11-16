import { cn } from '@/lib/utils';
import type { IconType } from 'react-icons';
import { LuLayoutDashboard, LuSettings } from 'react-icons/lu';
import { NavLink } from 'react-router';

interface NavigationItem {
  name: string;
  href: string;
  icon: IconType;
}

const navigation: NavigationItem[] = [
  { name: 'Inicio', href: '/', icon: LuLayoutDashboard },
  { name: 'Ajustes', href: '/ajustes', icon: LuSettings },
];

export function AppSidebar({ className }: { className?: string }) {
  return (
    <aside className={cn('flex h-svh w-64 shrink-0 flex-col border-r bg-background', className)}>
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
          TP
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">TurboPre</p>
          <p className="text-xs text-muted-foreground">Panel de administración</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                isActive && 'bg-muted text-foreground',
              )
            }
          >
            <item.icon className="size-4" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        <p className="rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
          Turborepo · pnpm workspaces
          <br />
          <span className="text-foreground">v0.1.0</span>
        </p>
      </div>
    </aside>
  );
}
