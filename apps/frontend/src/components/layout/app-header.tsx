import { useQueryClient } from '@tanstack/react-query';
import { LuLogOut, LuMenu } from 'react-icons/lu';
import { useLocation, useNavigate } from 'react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getInitials } from '@/lib/formatters';
import { useAuthStore } from '@/stores/use-auth-store';
import { AppSidebar } from './app-sidebar';

const routeTitles: Record<string, string> = {
  '/': 'Inicio',
  '/ajustes': 'Ajustes',
};

export function AppHeader() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = () => {
    signOut();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-16 items-center gap-3 border-b bg-background px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
            <LuMenu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <AppSidebar className="w-full border-r-0" />
        </SheetContent>
      </Sheet>

      <h1 className="text-sm font-semibold text-foreground md:text-base">
        {routeTitles[pathname] ?? 'TurboPre'}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {user?.role === 'ADMIN' ? 'Administrador' : 'Staff'}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">
                  {user ? getInitials(user.name) : 'TP'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{user?.name ?? 'Invitado'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="space-y-0.5">
              <p className="text-sm font-medium">{user?.name ?? 'Invitado'}</p>
              <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
              <LuLogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
