import { useParams } from 'react-router-dom';
import { useSession } from '@/hooks/useSessions';
import EmptyState from '@/components/common/EmptyState';
import RescheduleForm from '@/components/class-delivery/RescheduleForm';

export default function RequestReschedulePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session, isLoading, error } = useSession(sessionId || '');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !session) {
    return <EmptyState message="Session not found or error occurred." />;
  }

  if (session.status === 'COMPLETED' || session.status === 'MISSED') {
    return <EmptyState message={`Session is already ${session.status}.`} />;
  }

  return (
    <div className="request-reschedule-page">
      <h1>Request Reschedule</h1>
      <RescheduleForm session={{ id: session.id, scheduledStart: session.scheduledStart }} />
    </div>
  );
}
