import { useSearchParams } from 'react-router-dom';
import { useConsentStatus, useAcknowledgeConsent } from '@/hooks/useRecordingConsent';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
      <ul className="mb-4 text-sm">
        <li>Tutor: {data?.tutorAcknowledgedAt ? 'acknowledged' : 'pending'}</li>
        <li>Student/parent: {data?.studentOrParentAcknowledgedAt ? 'acknowledged' : 'pending'}</li>
      </ul>
      <Button
        onClick={() =>
          mutate(
            { tutorId, studentId },
            {
              onSuccess: () => toast.success('Consent acknowledged.'),
              onError: () => toast.error('Could not acknowledge consent. Please try again.'),
            }
          )
        }
        disabled={isPending}
      >
        Acknowledge
      </Button>
    </div>
  );
}
