import { useState } from 'react';
import { Link } from 'react-router-dom';

import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { totalPages as getTotalPages } from '@/lib/totalPages';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/constants';
import { useActivityHistory } from '@/hooks/useAdminReporting';
import type { ActivityEventType } from '@/types';

const LIMIT = 20;

type DateRange = '7d' | '30d' | '90d' | 'all';

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

const EVENT_TYPES: { value: ActivityEventType; label: string }[] = [
  { value: 'BOOKING', label: 'Booking' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'DISPUTE', label: 'Dispute' },
  { value: 'TUTOR_VERIFICATION', label: 'Tutor verification' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'PAYOUT', label: 'Payout' },
];

// Only entity types that already have an admin route; anything else is plain text.
const ENTITY_ROUTES: Record<string, string> = {
  ComplaintReport: ROUTES.ADMIN_DISPUTES,
  TutorProfile: ROUTES.ADMIN_TUTOR_VERIFICATION,
  Refund: ROUTES.ADMIN_REFUNDS,
  Payout: ROUTES.ADMIN_PAYOUTS,
};

export default function ActivityHistoryTable() {
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [eventType, setEventType] = useState<ActivityEventType | ''>('');

  const { data, isLoading, isError } = useActivityHistory({
    page,
    limit: LIMIT,
    dateRange,
    eventType: eventType || undefined,
  });

  const totalPages = getTotalPages(data);

  return (
    <section className="flex flex-col gap-space-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-m font-semibold">Activity history</h2>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-s">
            Date range
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value as DateRange);
                setPage(1);
              }}
              className="rounded-m border border-input bg-white px-2 py-1"
            >
              {DATE_RANGES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-s">
            Event type
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value as ActivityEventType | '');
                setPage(1);
              }}
              className="rounded-m border border-input bg-white px-2 py-1"
            >
              <option value="">All</option>
              {EVENT_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoading && <p className="text-s text-muted-foreground">Loading activity…</p>}
      {isError && (
        <p role="alert" className="text-s text-destructive">
          Could not load activity history.
        </p>
      )}

      {data && data.events.length === 0 && <EmptyState message="No activity for these filters." />}

      {data && data.events.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.events.map((ev) => {
                  const to = ENTITY_ROUTES[ev.relatedEntityType];
                  return (
                    <TableRow key={ev.id}>
                      <TableCell>{new Date(ev.occurredAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <StatusBadge status={ev.eventType} />
                      </TableCell>
                      <TableCell>{ev.summary}</TableCell>
                      <TableCell>
                        {to ? (
                          <Link to={to} className="text-primary underline">
                            View
                          </Link>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-s">
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
  );
}
