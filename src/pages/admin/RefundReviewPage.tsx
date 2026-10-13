import { useState } from 'react';
import { toast } from 'sonner';

import RefundCard from '@/components/admin-payments/RefundCard';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useApproveRefund, useRefundQueue, useRejectRefund } from '@/hooks/useRefunds';
import type { RefundStatus } from '@/types';

function apiMessage(error: unknown, fallback: string): string {
  const e = error as { response?: { data?: { message?: string } } };
  return e.response?.data?.message ?? fallback;
}

export default function RefundReviewPage() {
  const [status, setStatus] = useState<RefundStatus>('PENDING');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, isLoading, isError } = useRefundQueue(page, status);
  const approve = useApproveRefund();
  const reject = useRejectRefund();

  const handleApprove = (refundId: string) => {
    setBusyId(refundId);
    approve.mutate(refundId, {
      onSuccess: () => toast.success('Refund approved.'),
      onError: (error) => toast.error(apiMessage(error, 'Could not approve the refund.')),
      onSettled: () => setBusyId(null),
    });
  };

  const handleReject = (refundId: string, rejectionReason: string) => {
    setBusyId(refundId);
    reject.mutate(
      { refundId, rejectionReason },
      {
        onSuccess: () => toast.success('Refund rejected.'),
        onError: (error) => toast.error(apiMessage(error, 'Could not reject the refund.')),
        onSettled: () => setBusyId(null),
      }
    );
  };

  const renderBody = () => {
    if (isLoading) return <p role="status">Loading refunds…</p>;
    if (isError || !data || !Array.isArray(data.refunds)) {
      return <p role="alert">Could not load refunds.</p>;
    }
    if (data.refunds.length === 0) {
      return (
        <EmptyState
          message={status === 'PENDING' ? 'The refund queue is clear.' : 'No refunds found.'}
        />
      );
    }

    const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

    return (
      <>
        <ul className="flex flex-col gap-3">
          {data.refunds.map((refund) => (
            <li key={refund.id}>
              <RefundCard
                refund={refund}
                isBusy={busyId === refund.id}
                onApprove={() => handleApprove(refund.id)}
                onReject={(reason) => handleReject(refund.id, reason)}
              />
            </li>
          ))}
        </ul>
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
      </>
    );
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Refunds</h1>
      <div className="flex items-center gap-2">
        <Label htmlFor="refund-status">Status</Label>
        <select
          id="refund-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as RefundStatus);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      {renderBody()}
    </div>
  );
}
