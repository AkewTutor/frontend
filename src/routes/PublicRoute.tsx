import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants';

export default function PublicRoute() {
  const token = useAuthStore((s) => s.token);
  return token ? <Navigate to={ROUTES.HOME} replace /> : <Outlet />;
}
