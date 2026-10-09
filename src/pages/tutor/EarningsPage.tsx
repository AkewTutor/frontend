import { useState } from 'react';

import EmptyState from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMyEarnings } from '@/hooks/useEarnings';
import { formatMoney } from '@/lib/money';

const date = (iso: string) => new Date(iso).toLocaleDateString();

export default function EarningsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMyEarnings(page);

  if (isLoading)
    return (
      <p role="status" className="p-6">
        Loading earnings…
      </p>
    );
  if (isError || !data || !Array.isArray(data.earnings)) {
    return (
      <p role="alert" className="p-6">
        Could not load earnings.
      </p>
    );
  }

  const { upcomingPayout } = data;
  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Earnings</h1>

      {upcomingPayout && (
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <p className="text-s text-muted-foreground">Upcoming payout</p>
            <p className="text-l font-bold">{formatMoney(upcomingPayout.estimatedTotal)}</p>
            <p className="text-s text-muted-foreground">
              Period {date(upcomingPayout.periodStart)} – {date(upcomingPayout.periodEnd)} ·
              expected {date(upcomingPayout.expectedDate)}
            </p>
          </CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-space-md">
        <h2 className="text-m font-semibold">Sessions</h2>
        {data.earnings.length === 0 ? (
          <EmptyState message="No earnings yet." />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.earnings.map((earning) => {
              const reduced = earning.rateType !== 'FULL';
              return (
                <li
                  key={`${earning.sessionId}-${earning.createdAt}`}
                  className="flex items-center justify-between gap-3 rounded-m border border-border p-3"
                >
                  <div className="flex flex-col">
                    <span className="text-m font-semibold">{formatMoney(earning.amount)}</span>
                    <span className="text-s text-muted-foreground">{date(earning.createdAt)}</span>
                  </div>
                  <Badge variant={reduced ? 'warning' : 'default'}>
                    {' '}
                    {reduced ? 'Reduced rate (make-up)' : 'Full rate'}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}

        {data.earnings.length > 0 && (
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
      </section>
    </div>
  );
}
