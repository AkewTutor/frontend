import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { roleDefaultRoute } from '@/lib/roleDefaultRoute';

export default function PublicRoute() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  // token without user renders the page: redirecting would loop with ProtectedRoute
  return token && user ? <Navigate to={roleDefaultRoute(user.role)} replace /> : <Outlet />;
}
