import { useState } from 'react';

import StudentScope from '@/components/gamification/StudentScope';
import PaymentHistoryTable from '@/components/payments/PaymentHistoryTable';
import { Button } from '@/components/ui/button';
import { useMyPayments } from '@/hooks/usePayments';

function HistoryContent({ studentId }: { studentId: string | undefined }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMyPayments(page, studentId);

  if (isLoading) return <p role="status">Loading payments…</p>;
  if (isError || !data || !Array.isArray(data.payments)) {
    return <p role="alert">Could not load payments.</p>;
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <>
      <PaymentHistoryTable payments={data.payments} />
      {data.payments.length > 0 && (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-s text-muted-foreground">
            Page {data.page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}

export default function PaymentHistoryPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Payment history</h1>
      <StudentScope>
        {(studentId) => <HistoryContent key={studentId ?? 'self'} studentId={studentId} />}
      </StudentScope>
    </div>
  );
}
