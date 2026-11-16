import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/use-auth-store';

export function ProtectedRoute() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
