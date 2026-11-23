import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { authService } from '@/services/auth/auth.service';
import { useAuthStore } from '@/stores/use-auth-store';

let validatedToken: string | null = null;

export function ProtectedRoute() {
  const user = useCurrentUser();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const location = useLocation();

  useEffect(() => {
    if (!accessToken || validatedToken === accessToken) return;

    validatedToken = accessToken;

    authService
      .me()
      .then((authUser) => setUser(authUser))
      .catch(() => {
        // El interceptor de Axios cierra la sesión ante un 401.
        validatedToken = null;
      });
  }, [accessToken, setUser]);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
