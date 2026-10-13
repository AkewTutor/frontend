import type { ReactNode } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import { ROUTES } from '@/constants';
import { usePaymentPause } from '@/hooks/usePayments';
import { useAuthStore } from '@/store/auth.store';

function Check({ studentId, children }: { studentId?: string; children: ReactNode }) {
  const { isLoading, isPaused } = usePaymentPause(studentId);
  if (isLoading) return <p role="status">Loading…</p>;
  if (isPaused) {
    const to = studentId
      ? `${ROUTES.PAYMENT_PAUSED}?studentId=${studentId}`
      : ROUTES.PAYMENT_PAUSED;
    return <Navigate to={to} replace />;
  }
  return <>{children}</>; // on error: fail open; the backend stays authoritative
}

export default function PaymentPauseGuard({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.user?.role);
  const [params] = useSearchParams();
  const studentId = params.get('studentId') ?? undefined;
  // A Parent without a chosen child is asked to pick one by the page itself.
  if (role === 'PARENT' && !studentId) return <>{children}</>;
  return <Check studentId={studentId}>{children}</Check>;
}
