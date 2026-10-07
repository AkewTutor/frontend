import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { roleDefaultRoute } from '@/lib/roleDefaultRoute';
import { safeReturnTo } from '@/lib/safeReturnTo';

export default function PublicRoute() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [params] = useSearchParams();
  // token without user renders the page: redirecting would loop with ProtectedRoute
  if (!token || !user) return <Outlet />;
  // Honor a safe returnTo here: setAuth re-renders this guard first and unmounts LoginPage,
  // so the page's own mutate-level onSuccess never runs (TanStack Query v5).
  const target = safeReturnTo(params.get('returnTo')) ?? roleDefaultRoute(user.role);
  return <Navigate to={target} replace />;
}
