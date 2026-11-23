import { Badge } from '@/components/ui/badge';
import { POSITION_BY_ID, ROLE_BY_ID, ROLE_COLORS, getProcessShortName } from '@/features/preview/config';
import type { PositionId, RoleId } from '@/features/preview/types';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: RoleId;
  positionId?: PositionId;
  className?: string;
}

export function RoleBadge({ role, positionId, className }: RoleBadgeProps) {
  const color = ROLE_COLORS[role];
  const label = positionId
    ? `${POSITION_BY_ID[positionId].shortName} · ${getProcessShortName(POSITION_BY_ID[positionId].processId)}`
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
