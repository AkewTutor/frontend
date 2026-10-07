import { useState } from 'react';
import { toast } from 'sonner';

import ApprovalQueueTable from '@/components/admin-matching/ApprovalQueueTable';
import { Button } from '@/components/ui/button';
import { useApproveCohort, useApprovalQueue, useRejectCohort } from '@/hooks/useAdminMatching';

export default function MatchingQueuePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useApprovalQueue(page);
  const approve = useApproveCohort();
  const reject = useRejectCohort();

  if (isLoading) return <p className="p-6">Loading approval queue…</p>;
  if (isError || !data) {
    return <p className="p-6">We couldn&apos;t load the approval queue. Please try again later.</p>;
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  const handleApprove = (cohortId: string) => {
    approve.mutate(cohortId, {
      onSuccess: () => toast.success('Cohort approved.'),
      onError: () => toast.error('Could not approve this cohort. Please try again.'),
    });
  };

  const handleReject = (cohortId: string, reason: string) => {
    reject.mutate(
      { cohortId, reason },
      {
        onSuccess: () => toast.success('Cohort rejected.'),
        onError: () => toast.error('Could not reject this cohort. Please try again.'),
      }
    );
  };

  return (
    <div className="flex flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Approval queue</h1>
      {/* API key is `queue`; the table prop is `items` (doc conflict 2). */}
      <ApprovalQueueTable items={data.queue} onApprove={handleApprove} onReject={handleReject} />
      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
