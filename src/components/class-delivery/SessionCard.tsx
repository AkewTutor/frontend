import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CountdownTimer from '@/components/common/CountdownTimer';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';
import type { ScheduledSession } from '@/types';

interface Props {
  session: ScheduledSession;
}

export default function SessionCard({ session }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const isStarted = now >= new Date(session.scheduledStart).getTime();
  const showBadge = isStarted && !['MISSING', 'ESCALATED'].includes(session.recordingStatus);
  const showReschedule = !['COMPLETED', 'MISSED'].includes(session.status);

  return (
    <div className="flex flex-col gap-4 rounded-md border p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{session.cohortId}</h3>
          <CountdownTimer targetIso={session.scheduledStart} />
        </div>
        <StatusBadge status={session.status} />
      </div>

      {showBadge && (
        <div className="w-fit">
          <StatusBadge status={session.recordingStatus} />
        </div>
      )}

      <div className="mt-2 flex items-center gap-4">
        <Button
          disabled={!session.jitsiLinkUrl}
          onClick={() => session.jitsiLinkUrl && window.open(session.jitsiLinkUrl, '_blank')}
        >
          Join
        </Button>
        {showReschedule && (
          <Link
            to={ROUTES.RESCHEDULE.replace(':sessionId', session.id)}
            className="text-sm text-primary hover:underline"
          >
            Request reschedule
          </Link>
        )}
      </div>
    </div>
  );
}
