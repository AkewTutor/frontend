import { useSearchParams } from 'react-router-dom';
import { useConsentStatus, useAcknowledgeConsent } from '@/hooks/useRecordingConsent';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

export default function RecordingConsentPage() {
  const [params] = useSearchParams();
  const tutorId = params.get('tutorId') ?? undefined;
  const studentId = params.get('studentId') ?? undefined;

  const { data, isLoading } = useConsentStatus({ tutorId, studentId });
  const { mutate, isPending } = useAcknowledgeConsent();

  if (!tutorId || !studentId) {
    return <EmptyState message="Missing tutor or student ID" />;
  }

  if (isLoading) {
    return (
      <div data-testid="loading" className="p-4">
        Loading...
      </div>
    );
  }

  if (data?.consentComplete) {
    return (
      <div className="rounded-md border p-4">
        <h2 className="mb-4 text-xl font-bold">Consent Acknowledged</h2>
        <p>Acknowledged at: {data.tutorAcknowledgedAt || data.studentOrParentAcknowledgedAt}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-4">
      <h2 className="mb-4 text-xl font-bold">Recording Consent</h2>
      <p className="mb-4">Please acknowledge that sessions may be recorded.</p>
      <Button onClick={() => mutate({ tutorId, studentId })} disabled={isPending}>
        Acknowledge
      </Button>
    </div>
  );
}
