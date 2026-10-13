import { useSearchParams } from 'react-router-dom';
import { useUpcomingSessions } from '@/hooks/useSessions';
import SessionCard from '@/components/class-delivery/SessionCard';
import EmptyState from '@/components/common/EmptyState';
import { useAuthStore } from '@/store/auth.store';
import type { ScheduledSession } from '@/types';

function UpcomingList({ studentId }: { studentId?: string }) {
  const { data, isLoading } = useUpcomingSessions({ studentId });

  if (isLoading) {
    return (
      <div data-testid="loading" className="p-4">
        Loading...
      </div>
    );
  }

  if (!data?.sessions.length) {
    return <EmptyState message="No classes scheduled yet" />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="mb-4 text-2xl font-bold">Upcoming Classes</h1>
      <div className="flex flex-col gap-4">
        {data.sessions.map((session) => (
          <SessionCard key={session.id} session={session as unknown as ScheduledSession} />
        ))}
      </div>
    </div>
  );
}

export default function UpcomingClassesPage() {
  const [params] = useSearchParams();
  const studentId = params.get('studentId') ?? undefined;
  const user = useAuthStore((s) => s.user);

  if (user?.role === 'PARENT' && !studentId) {
    return <EmptyState message="Please select a student" />;
  }

  return <UpcomingList studentId={studentId} />;
}
