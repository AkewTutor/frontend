import { Link } from 'react-router-dom';
import { useUpcomingSessions } from '@/hooks/useSessions';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { ROUTES } from '@/constants';

export default function MyClassesPage() {
  const { data, isLoading } = useUpcomingSessions();

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
      <h1 className="mb-4 text-2xl font-bold">My Classes</h1>
      <ul className="flex flex-col gap-4">
        {data.sessions.map((session) => (
          <li key={session.id} className="flex flex-col gap-3 rounded-md border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {new Date(session.scheduledStart).toLocaleString()}
                </h2>
                <p className="text-sm text-muted-foreground">Cohort {session.cohortId}</p>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={session.status} />
                <StatusBadge status={session.recordingStatus} />
              </div>
            </div>
            <div className="flex gap-4">
              <Link
                to={ROUTES.TUTOR_CONDUCT_CLASS.replace(':sessionId', session.id)}
                className="text-sm text-primary hover:underline"
              >
                Conduct class
              </Link>
              <Link
                to={ROUTES.TUTOR_ASSESSMENTS.replace(':cohortId', session.cohortId)}
                className="text-sm text-primary hover:underline"
              >
                Assessments
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
