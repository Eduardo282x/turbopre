import { Menu, PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useClock } from '@/hooks/use-clock';
import { usePageMeta } from '@/hooks/use-page-meta';
import { formatTime } from '@/lib/formatters';
import { isPreviewMode } from '@/lib/preview';
import { AppSidebar } from './app-sidebar';
import { PreviewRoleSwitcher } from './preview-role-switcher';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

interface AppHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AppHeader({ collapsed, onToggleCollapse }: AppHeaderProps) {
  const { title, subtitle } = usePageMeta();
  const now = useClock();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-border/80 bg-background/85 px-4 py-2 backdrop-blur-md md:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Abrir menú">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navegación principal</SheetTitle>
          <AppSidebar onNavigate={() => setMobileOpen(false)} className="w-full border-r-0" />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:flex">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          className="text-muted-foreground"
        >
          <PanelLeftOpen className={collapsed ? undefined : 'rotate-180'} />
        </Button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-heading text-lg font-semibold tracking-tight text-foreground">
            {title}
          </p>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[10px] font-semibold text-primary">
            CAMI
          </Badge>
          {isPreviewMode && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Demo
            </Badge>
          )}
        </div>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Badge variant="outline" className="hidden font-mono text-[11px] tabular-nums md:inline-flex">
          {formatTime(now)}
        </Badge>
        {isPreviewMode && <PreviewRoleSwitcher />}
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
