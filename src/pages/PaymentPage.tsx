import { useState } from 'react';
import { faCreditCard } from '@fortawesome/free-solid-svg-icons';

import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import StudentScope from '@/components/gamification/StudentScope';
import ChapaCheckoutButton from '@/components/payments/ChapaCheckoutButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMyCohorts } from '@/hooks/useCohort';
import { useMyPayments } from '@/hooks/usePayments';
import { useActivePricing } from '@/hooks/usePricing';
import { formatMoney } from '@/lib/money';

function LatestPayment({ studentId }: { studentId: string | undefined }) {
  // Never assume success from the redirect back: show what the server says.
  const { data } = useMyPayments(1, studentId);
  const latest = data?.payments?.[0];
  if (!latest) return null;
  return (
    <p className="flex items-center gap-2 text-s">
      Latest payment: {formatMoney(latest.amount)} <StatusBadge status={latest.status} />
    </p>
  );
}

function PaymentContent({ studentId }: { studentId: string | undefined }) {
  const cohorts = useMyCohorts(studentId);
  const pricing = useActivePricing();
  const [code, setCode] = useState('');

  if (cohorts.isLoading || pricing.isLoading) return <p role="status">Loading…</p>;
  if (cohorts.isError || pricing.isError)
    return <p role="alert">Could not load payment details.</p>;

  const due = (cohorts.data?.cohorts ?? []).filter((c) => c.membershipStatus === 'PENDING_PAYMENT');

  return (
    <div className="flex flex-col gap-space-md">
      <LatestPayment studentId={studentId} />
      {due.length === 0 ? (
        <EmptyState icon={faCreditCard} message="Nothing to pay right now." />
      ) : (
        <>
          <div className="flex max-w-sm flex-col gap-2">
            <Label htmlFor="promo-code">Promotion code (optional)</Label>
            <Input id="promo-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <ul className="flex flex-col gap-space-md">
            {due.map((c) => {
              const price = pricing.data?.pricing.find((p) => p.format === c.format);
              return (
                <li
                  key={c.cohortMembershipId}
                  className="flex flex-col gap-3 rounded-m bg-white p-6 shadow-card"
                >
                  <p className="text-m font-semibold">
                    {c.format.replace(/_/g, ' ').toLowerCase()}
                  </p>
                  <p className="text-s text-muted-foreground">
                    {price
                      ? `${formatMoney(price.pricePerStudentPerHour)} per hour`
                      : 'Price unavailable'}
                  </p>
                  <ChapaCheckoutButton
                    cohortMembershipId={c.cohortMembershipId}
                    promotionCode={code}
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Payment</h1>
      <StudentScope>
        {(studentId) => <PaymentContent key={studentId ?? 'self'} studentId={studentId} />}
      </StudentScope>
    </div>
  );
}
