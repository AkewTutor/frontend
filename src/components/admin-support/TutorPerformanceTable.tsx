import { useState } from 'react';

import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTutorPerformance } from '@/hooks/useAdminReporting';

const LIMIT = 20;

const SORT_OPTIONS = [
  { value: 'uniqueStudentsTaught', label: 'Students taught' },
  { value: 'badgeCount', label: 'Badges' },
  { value: 'complaintCount', label: 'Complaints' },
];

export default function TutorPerformanceTable() {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('uniqueStudentsTaught');
  const { data, isLoading, isError } = useTutorPerformance({ page, limit: LIMIT, sortBy });

  const totalPages = data?.pagination?.totalPages ?? 1;

  return (
    <section className="flex flex-col gap-space-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-m font-semibold">Tutor performance</h2>
        <label className="flex items-center gap-2 text-s">
          Sort by
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="rounded-m border border-input bg-white px-2 py-1"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p className="text-s text-muted-foreground">Loading tutors…</p>}
      {isError && (
        <p role="alert" className="text-s text-destructive">
          Could not load tutor performance.
        </p>
      )}

      {data && data.tutors.length === 0 && <EmptyState message="No tutors to show yet." />}

      {data && data.tutors.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Students taught</TableHead>
                  <TableHead>Active cohorts</TableHead>
                  <TableHead>Completed sessions</TableHead>
                  <TableHead>Tutor-caused misses</TableHead>
                  <TableHead>Badges</TableHead>
                  <TableHead>Complaints</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tutors.map((t) => (
                  <TableRow key={t.tutorId}>
                    <TableCell className="font-medium">{t.fullName}</TableCell>
                    <TableCell>
                      <StatusBadge status={t.verificationStatus} />
                    </TableCell>
                    <TableCell>{t.uniqueStudentsTaught}</TableCell>
                    <TableCell>{t.activeCohortCount}</TableCell>
                    <TableCell>{t.completedSessionCount}</TableCell>
                    <TableCell>{t.tutorCausedMissCount}</TableCell>
                    <TableCell>{t.badgeCount}</TableCell>
                    <TableCell>{t.complaintCount}</TableCell>
                  </TableRow>
                ))}
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
