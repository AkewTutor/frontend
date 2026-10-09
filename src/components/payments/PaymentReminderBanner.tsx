import { useState } from 'react';
import { Link } from 'react-router-dom';

import CountdownTimer from '@/components/common/CountdownTimer';
import { ROUTES } from '@/constants';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

// One instance per student (map from a list; never one combined banner).
// Shows only inside the 3-day window before dueDate.
export default function PaymentReminderBanner({
  studentId,
  dueDate,
}: {
  studentId: string;
  dueDate: string;
}) {
  const [now] = useState(() => Date.now());
  const remaining = new Date(dueDate).getTime() - now;
  if (!Number.isFinite(remaining) || remaining > THREE_DAYS_MS) return null;

  return (
    <div
      role="status"
      data-student-id={studentId}
      className="flex flex-wrap items-center gap-3 rounded-m bg-accent p-4 text-accent-foreground"
    >
      <span className="text-s font-semibold">Payment due in</span>
      <CountdownTimer targetIso={dueDate} />
      <Link to={ROUTES.PAYMENTS} className="text-s font-semibold underline">
        Pay now
      </Link>
    </div>
  );
}
