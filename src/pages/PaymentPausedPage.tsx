import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { faCircleCheck, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQueryClient } from '@tanstack/react-query';

import StudentScope from '@/components/gamification/StudentScope';
import { Button } from '@/components/ui/button';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { usePaymentPause } from '@/hooks/usePayments';
import { useAuthStore } from '@/store/auth.store';

function PauseContent({ studentId }: { studentId: string | undefined }) {
  const { isLoading, isError, isPaused, pauses } = usePaymentPause(studentId);
  const qc = useQueryClient();

  // Resume is server-side; just pick up the corrected schedule once the block lifts.
  useEffect(() => {
    if (!isLoading && !isError && !isPaused) {
      void qc.invalidateQueries({ queryKey: [QUERY_KEYS.SESSIONS] });
    }
  }, [isLoading, isError, isPaused, qc]);

  if (isLoading) return <p role="status">Checking your payment status…</p>;
  if (isError) return <p role="alert">Could not check your payment status.</p>;

  if (!isPaused) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="flex items-center gap-2 text-m">
          <FontAwesomeIcon icon={faCircleCheck} className="text-primary" aria-hidden="true" />
          Your payments are up to date.
        </p>
        <Button asChild>
          <Link to={ROUTES.STUDENT_UPCOMING_CLASSES}>View upcoming classes</Link>
        </Button>
      </div>
    );
  }

  const affected = pauses.reduce((n, p) => n + (p.affectedSessions?.length ?? 0), 0);
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-m bg-white p-6 shadow-card"
    >
      <FontAwesomeIcon icon={faLock} className="text-l text-danger" aria-hidden="true" />
      <h2 className="text-m font-bold">Classes are paused until payment is made</h2>
      <p className="text-s text-muted-foreground">
        {affected > 0
          ? `${affected} session(s) will be rescheduled automatically once payment goes through.`
          : 'Your sessions will resume once payment goes through.'}
      </p>
      <Button asChild>
        <Link to={ROUTES.PAYMENTS}>Pay now</Link>
      </Button>
    </div>
  );
}

export default function PaymentPausedPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [params] = useSearchParams();
  const studentId = params.get('studentId') ?? undefined;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Payment status</h1>
      {role === 'PARENT' && studentId ? (
        <PauseContent studentId={studentId} />
      ) : (
        <StudentScope>{(id) => <PauseContent key={id ?? 'self'} studentId={id} />}</StudentScope>
      )}
    </div>
  );
}
