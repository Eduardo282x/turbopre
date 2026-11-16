import { Navigate, Outlet, useLocation } from 'react-router';
import { useCurrentUser } from '@/features/preview/store/preview-session';

export function ProtectedRoute() {
  const user = useCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
