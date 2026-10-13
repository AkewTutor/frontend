import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useDisputeQueue, useReviewDispute, useResolveDispute } from '@/hooks/useAdminDisputes';
import type { ComplaintCategory, ComplaintStatus } from '@/types';
import DisputeCard from '@/components/admin-support/DisputeCard';
import type { DisputeResolutionBody } from '@/components/admin-support/DisputeCard';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: ComplaintStatus[] = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'];
const CATEGORY_OPTIONS: ComplaintCategory[] = [
  'SESSION_ISSUE',
  'TUTOR_CONDUCT',
  'PAYMENT_ISSUE',
  'MESSAGE_ISSUE',
  'OTHER',
];

const FIELD_CLASS = 'rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm';

const humanize = (v: string) => {
  const s = v.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function DisputeQueuePage() {
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | undefined>();
  const [page, setPage] = useState(1);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const queue = useDisputeQueue(statusFilter, categoryFilter, page);
  const detail = useReviewDispute(selectedComplaintId);
  const resolve = useResolveDispute();

  const handleStatus = (e: ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value ? (e.target.value as ComplaintStatus) : undefined);
    setPage(1);
  };
  const handleCategory = (e: ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value ? (e.target.value as ComplaintCategory) : undefined);
    setPage(1);
  };

  const handleResolve = (body: DisputeResolutionBody) => {
    if (!selectedComplaintId) return;
    resolve.mutate({ complaintId: selectedComplaintId, ...body });
  };

  const complaints = queue.data?.complaints ?? [];
  const limit = queue.data?.limit ?? 20;
  const total = queue.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-space-md p-6">
      <h1 className="text-heading font-bold">Disputes</h1>

      <div className="flex flex-wrap gap-space-sm">
        <select
          aria-label="Filter by status"
          className={FIELD_CLASS}
          value={statusFilter ?? ''}
          onChange={handleStatus}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by category"
          className={FIELD_CLASS}
          value={categoryFilter ?? ''}
          onChange={handleCategory}
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {humanize(c)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-space-md lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-label="Dispute queue" className="space-y-space-sm">
          {queue.isLoading ? (
            <p>Loading disputes...</p>
          ) : queue.error ? (
            <EmptyState message="Could not load the dispute queue." />
          ) : complaints.length === 0 ? (
            <EmptyState message="Queue clear. No disputes match these filters." />
          ) : (
            <>
              <ul className="space-y-space-xs">
                {complaints.map((c) => {
                  const selected = c.id === selectedComplaintId;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        data-testid={`dispute-row-${c.id}`}
                        aria-pressed={selected}
                        onClick={() => setSelectedComplaintId(c.id)}
                        className={cn(
                          'flex w-full items-center justify-between gap-space-sm rounded-md border px-3 py-2 text-left text-sm',
                          selected ? 'border-primary bg-muted' : 'border-neutral-200 bg-white'
                        )}
                      >
                        <span>
                          <span className="block font-medium">{humanize(c.category)}</span>
                          <span className="block text-muted-foreground">
                            {humanize(c.reporterRole)} ·{' '}
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </span>
                        <StatusBadge status={c.status} />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center gap-space-sm">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </section>

        <section aria-label="Dispute detail">
          {!selectedComplaintId ? (
            <EmptyState message="Select a dispute to review it." />
          ) : detail.isLoading ? (
            <p>Loading dispute...</p>
          ) : detail.error || !detail.data ? (
            <EmptyState message="Could not load this dispute." />
          ) : (
            <DisputeCard
              key={detail.data.id}
              complaint={detail.data}
              onResolve={handleResolve}
              isSubmitting={resolve.isPending}
            />
          )}
        </section>
      </div>
    </div>
  );
}
