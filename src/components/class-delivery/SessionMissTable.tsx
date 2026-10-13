import type { SessionMiss } from '@/types';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';

export interface SessionMissTableProps {
  misses: SessionMiss[];
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  showTutor?: boolean;
  onSelectTutor?: (id: string) => void;
}

export default function SessionMissTable({
  misses,
  page,
  limit,
  total,
  onPageChange,
  isLoading,
  showTutor,
  onSelectTutor,
}: SessionMissTableProps) {
  if (isLoading) return <div>Loading...</div>;
  if (misses.length === 0) return <EmptyState message="No session misses found." />;

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="session-miss-table">
      <table>
        <thead>
          <tr>
            <th>Session ID</th>
            {showTutor && <th>Tutor</th>}
            <th>Caused By</th>
            <th>Miss Type</th>
            <th>Make-up</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {misses.map((miss) => (
            <tr key={miss.id}>
              <td>{miss.sessionId}</td>
              {showTutor && (
                <td>
                  <Button variant="ghost" size="sm" onClick={() => onSelectTutor?.(miss.tutorId)}>
                    {miss.tutorId}
                  </Button>
                </td>
              )}
              <td>
                <StatusBadge status={miss.causedBy} />
              </td>
              <td>
                <StatusBadge status={miss.missType} />
              </td>
              <td>{miss.makeupSessionId ? 'Queued' : 'None'}</td>
              <td>{miss.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <Button onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Prev
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}
