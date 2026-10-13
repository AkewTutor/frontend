import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSessionMisses } from '@/hooks/useSessionMiss';
import SessionMissTable from '@/components/class-delivery/SessionMissTable';
import EscalationBanner from '@/components/class-delivery/EscalationBanner';
import RecordMissForm from '@/components/class-delivery/RecordMissForm';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

export default function AdminSessionMissesPage() {
  const [searchParams] = useSearchParams();
  const initialSessionId = searchParams.get('sessionId');

  const [tutorId, setTutorId] = useState<string>('');
  const [causedBy, setCausedBy] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const handleFilterChange =
    (setter: (v: string) => void) => (e: { target: { value: string } }) => {
      setter(e.target.value);
      setPage(1);
    };

  const handleTutorSelect = (id: string) => {
    setTutorId(id);
    setPage(1);
  };

  const clearFilters = () => {
    setTutorId('');
    setCausedBy('');
    setPage(1);
  };

  const { data, isLoading, error } = useSessionMisses({
    page,
    limit,
    ...(tutorId ? { tutorId } : {}),
    ...(causedBy ? { causedBy } : {}),
  });

  const banner = tutorId
    ? { visible: data?.escalationFlag === true }
    : { visible: (data?.escalatedTutorIds?.length ?? 0) > 0, tutorIds: data?.escalatedTutorIds };

  return (
    <div className="admin-session-misses-page">
      <h1>Admin: Session Misses</h1>

      <div className="admin-actions" style={{ display: 'flex', gap: '2rem' }}>
        <div className="record-panel">
          <h2>Record a Miss</h2>
          <RecordMissForm initialSessionId={initialSessionId} />
        </div>

        <div className="list-panel" style={{ flex: 1 }}>
          <div className="filters">
            <input
              placeholder="Tutor ID"
              value={tutorId}
              onChange={handleFilterChange(setTutorId)}
            />
            <select value={causedBy} onChange={handleFilterChange(setCausedBy)}>
              <option value="">Any Caused By</option>
              <option value="TUTOR">Tutor</option>
              <option value="STUDENT">Student</option>
            </select>
            <Button onClick={clearFilters} variant="secondary">
              Clear Filters
            </Button>
          </div>

          <EscalationBanner {...banner} onSelectTutor={handleTutorSelect} />

          {error ? (
            <EmptyState message="Error loading session misses." />
          ) : (
            <SessionMissTable
              isLoading={isLoading}
              misses={data?.misses || []}
              page={data?.page || page}
              limit={data?.limit || limit}
              total={data?.total || 0}
              onPageChange={setPage}
              showTutor
              onSelectTutor={handleTutorSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}
