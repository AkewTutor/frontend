import { useState } from 'react';
import { useComplianceQueue } from '@/hooks/useRecordings';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

export default function RecordingComplianceQueuePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useComplianceQueue(page);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <EmptyState message="Error loading compliance queue." />;
  }

  const sessions = data?.sessions ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="recording-compliance-queue-page">
      <h1>Admin: Recording Compliance Queue</h1>

      {sessions.length === 0 ? (
        <EmptyState message="Queue clear" />
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '0.5rem' }}>Session ID</th>
                <th style={{ padding: '0.5rem' }}>Cohort ID</th>
                <th style={{ padding: '0.5rem' }}>Tutor ID</th>
                <th style={{ padding: '0.5rem' }}>Scheduled End</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((row) => {
                const isEscalated = row.recordingStatus === 'ESCALATED';
                return (
                  <tr
                    key={row.sessionId}
                    data-testid={`row-${row.sessionId}`}
                    style={
                      isEscalated
                        ? {
                            backgroundColor: 'var(--color-danger, #ffe6e6)',
                            borderLeft: '4px solid var(--color-danger)',
                          }
                        : { borderBottom: '1px solid #eee' }
                    }
                  >
                    <td style={{ padding: '0.5rem' }}>{row.sessionId}</td>
                    <td style={{ padding: '0.5rem' }}>{row.cohortId}</td>
                    <td style={{ padding: '0.5rem' }}>{row.tutorId}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {new Date(row.scheduledEnd).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <StatusBadge
                        status={row.recordingStatus}
                        severity={isEscalated ? 'danger' : 'warning'}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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
    </div>
  );
}
