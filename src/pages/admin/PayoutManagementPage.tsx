import { useState } from 'react';
import { toast } from 'sonner';

import PayoutBatchTable from '@/components/admin-payments/PayoutBatchTable';
import { Button } from '@/components/ui/button';
import { useMarkPaid, usePayoutBatches } from '@/hooks/usePayouts';

function apiMessage(error: unknown, fallback: string): string {
  const e = error as { response?: { data?: { message?: string } } };
  return e.response?.data?.message ?? fallback;
}

export default function PayoutManagementPage() {
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { data, isLoading, isError } = usePayoutBatches(page);
  const markPaid = useMarkPaid();

  const handleMarkPaid = (payoutId: string) => {
    setPendingId(payoutId);
    markPaid.mutate(payoutId, {
      onSuccess: () => toast.success('Payout marked as paid.'),
      onError: (error) => toast.error(apiMessage(error, 'Could not mark the payout as paid.')),
      onSettled: () => setPendingId(null),
    });
  };

  const renderBody = () => {
    if (isLoading) return <p role="status">Loading payouts…</p>;
    if (isError || !data || !Array.isArray(data.payouts)) {
      return <p role="alert">Could not load payouts.</p>;
    }

    const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

    return (
      <>
        <PayoutBatchTable
          payouts={data.payouts}
          onMarkPaid={handleMarkPaid}
          pendingId={pendingId}
        />
        {data.payouts.length > 0 && (
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
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Payouts</h1>
      {renderBody()}
    </div>
  );
}
