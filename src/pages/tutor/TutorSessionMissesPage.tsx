import { useState } from 'react';
import { useSessionMisses } from '@/hooks/useSessionMiss';
import SessionMissTable from '@/components/class-delivery/SessionMissTable';
import EscalationBanner from '@/components/class-delivery/EscalationBanner';
import EmptyState from '@/components/common/EmptyState';

export default function TutorSessionMissesPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error } = useSessionMisses({ page, limit });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <EmptyState message="Error loading session misses." />;

  return (
    <div className="tutor-session-misses-page">
      <h1>My Session Misses</h1>
      <EscalationBanner visible={data?.escalationFlag === true} />
      <SessionMissTable
        misses={data?.misses || []}
        page={data?.page || page}
        limit={data?.limit || limit}
        total={data?.total || 0}
        onPageChange={setPage}
      />
    </div>
  );
}
