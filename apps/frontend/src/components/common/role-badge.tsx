import { Badge } from '@/components/ui/badge';
import { ROLE_COLORS, ROLE_BY_ID, getAreaShortName } from '@/features/preview/config';
import type { RoleId, User } from '@/features/preview/types';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: RoleId;
  areaId?: User['areaId'];
  className?: string;
}

export function RoleBadge({ role, areaId, className }: RoleBadgeProps) {
  const color = ROLE_COLORS[role];
  const label =
    role === 'OPERATOR' && areaId
      ? `Operador · ${getAreaShortName(areaId)}`
      : ROLE_BY_ID[role].label;

  return (
    <Badge
      variant="outline"
      className={cn('border font-medium', className)}
      style={{
        borderColor: `${color}55`,
        backgroundColor: `${color}18`,
        color,
      }}
    >
      {label}
    </Badge>
  );
}
