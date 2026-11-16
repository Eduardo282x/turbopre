import { Navigate, Outlet } from 'react-router';
import { ForbiddenPage } from '@/pages/forbidden-page';
import type { RoleId } from '@/features/preview/types';
import { useCurrentUser } from '@/features/preview/store/preview-session';

interface RoleGuardProps {
  roles: RoleId[];
}

export function RoleGuard({ roles }: RoleGuardProps) {
  const user = useCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}
