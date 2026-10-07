import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants';
import { roleDefaultRoute } from '@/lib/roleDefaultRoute';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  roles: Role[] | 'any';
}

export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  // token without user (corrupted persisted store) is treated as logged out
  if (!token || !user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${ROUTES.LOGIN}?returnTo=${returnTo}`} replace />;
  }
  if (roles !== 'any' && !roles.includes(user.role)) {
    return <Navigate to={roleDefaultRoute(user.role)} replace />;
  }
  return <Outlet />;
}
