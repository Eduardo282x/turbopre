import { Check, UserCog } from 'lucide-react';
import { toast } from 'sonner';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { getRoleDisplay } from '@/features/preview/config';
import { useCurrentUser, usePreviewSession } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { getInitials } from '@/lib/formatters';

export function PreviewRoleSwitcher() {
  const user = useCurrentUser();
  const users = usePreviewStore((state) => state.db.users);
  const switchUser = usePreviewSession((state) => state.switchUser);

  if (!user) return null;

  const sorted = [...users].sort((a, b) => {
    const roleCompare = a.role.localeCompare(b.role);
    if (roleCompare !== 0) return roleCompare;
    return a.name.localeCompare(b.name, 'es');
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex">
          <UserCog />
          <span className="max-w-36 truncate">{getRoleDisplay(user)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Cambiar usuario preview</span>
          <Badge variant="outline" className="text-[10px]">
            {users.length} usuarios
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
          <div className="p-1">
            {sorted.map((candidate) => (
              <DropdownMenuItem
                key={candidate.id}
                onSelect={() => {
                  switchUser(candidate.id);
                  toast.success(`Ahora navegas como ${candidate.name}`);
                }}
                className="gap-2"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                  {getInitials(candidate.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{candidate.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {getRoleDisplay(candidate)}
                  </span>
                </span>
                {candidate.id === user.id && <Check className="ml-auto text-primary" />}
              </DropdownMenuItem>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
