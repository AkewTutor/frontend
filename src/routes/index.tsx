import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AuthLayout from '@/components/layouts/AuthLayout';
import { ROUTES } from '@/constants';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  );
}

// Wrap each lazy element so Suspense boundaries stay per-page,
// matching the granularity your original Suspense had.
const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ path: ROUTES.LOGIN, element: withSuspense(<LoginPage />) }],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [{ path: ROUTES.HOME, element: withSuspense(<DashboardPage />) }],
      },
    ],
  },
  { path: '*', element: withSuspense(<NotFoundPage />) },
]);

export default router;
