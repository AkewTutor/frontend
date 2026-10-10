import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useMyComplaints } from '@/hooks/useComplaints';
import type { ComplaintStatus } from '@/types';
import ComplaintForm from '@/components/support/ComplaintForm';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';

const STATUS_OPTIONS: ComplaintStatus[] = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'];

const humanize = (v: string) => {
  const s = v.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function SubmitComplaintPage() {
  const [status, setStatus] = useState<ComplaintStatus | undefined>();
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useMyComplaints(status, page);

  const complaints = data?.complaints ?? [];
  const limit = data?.limit ?? 20;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleStatus = (e: ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value ? (e.target.value as ComplaintStatus) : undefined);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-space-lg p-6">
      <section aria-label="File a complaint" className="space-y-space-md">
        <h1 className="text-heading font-bold">File a complaint</h1>
        <ComplaintForm />
      </section>

      <section aria-label="Your complaints" className="space-y-space-sm">
        <div className="flex items-center justify-between gap-space-sm">
          <h2 className="text-l font-bold">Your complaints</h2>
          <select
            aria-label="Filter by status"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            value={status ?? ''}
            onChange={handleStatus}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p>Loading your complaints...</p>
        ) : error ? (
          <EmptyState message="Could not load your complaints." />
        ) : complaints.length === 0 ? (
          <EmptyState message="You have not filed any complaints." />
        ) : (
          <>
            <ul className="space-y-space-xs">
              {complaints.map((c) => (
                <li
                  key={c.id}
                  data-testid={`complaint-${c.id}`}
                  className="flex items-center justify-between gap-space-sm rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
                >
                  <span>
                    <span className="block font-medium">{humanize(c.category)}</span>
                    <span className="block text-muted-foreground">
                      Filed {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </span>
                  <StatusBadge status={c.status} />
                </li>
              ))}
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
    </div>
  );
}
