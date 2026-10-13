import React, { useState } from 'react';
import { useRequestReschedule, type RescheduleClassification } from '@/hooks/useReschedule';
import { classifyReschedule } from '@/lib/classifyReschedule';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';
import { Link } from 'react-router-dom';

interface RescheduleFormProps {
  session: { id: string; scheduledStart: string };
  onSuccess?: () => void;
}

export default function RescheduleForm({ session, onSuccess }: RescheduleFormProps) {
  const [requestedNewStart, setRequestedNewStart] = useState('');
  const [previewClassification, setPreviewClassification] =
    useState<RescheduleClassification | null>(null);

  const { mutate, data, error, isPending, isSuccess } = useRequestReschedule();

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRequestedNewStart(val);
    if (val) {
      setPreviewClassification(classifyReschedule(session.scheduledStart, new Date()));
    } else {
      setPreviewClassification(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedNewStart) return;

    mutate(
      {
        sessionId: session.id,
        requestedNewStart: new Date(requestedNewStart).toISOString(),
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  if (isSuccess && data) {
    return (
      <div className="reschedule-confirmation">
        <h2>Reschedule Request Confirmed</h2>
        <p>Your session has been requested to be rescheduled to {data.requestedNewStart}.</p>
        <p>Notice provided: {data.noticeHours} hours</p>
        <p>
          Classification: <StatusBadge status={data.classification} />
        </p>

        {data.classification === 'SAME_DAY_MISS' && (
          <div className="same-day-miss-warning">
            <strong>Warning:</strong> A missed-session record was created because this reschedule
            was requested with less than 12 hours notice.
            {data.sessionMissId && <span> Miss Record ID: {data.sessionMissId}</span>}
          </div>
        )}

        <Link to={ROUTES.STUDENT_UPCOMING_CLASSES}>Back to Upcoming Classes</Link>
      </div>
    );
  }

  let errorMessage = '';
  if (error) {
    errorMessage =
      (error.response?.data as { message?: string } | undefined)?.message ||
      'An error occurred while requesting reschedule.';
  }

  return (
    <form onSubmit={handleSubmit} className="reschedule-form">
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <label>
        New Time:
        <input
          type="datetime-local"
          value={requestedNewStart}
          onChange={handleTimeChange}
          data-testid="datetime-input"
        />
      </label>

      {previewClassification && (
        <div className="preview">
          Preview Classification: <StatusBadge status={previewClassification} /> (based on original
          session start)
        </div>
      )}

      <Button type="submit" variant="primary" size="md" disabled={!requestedNewStart || isPending}>
        {isPending ? 'Submitting...' : 'Request Reschedule'}
      </Button>
    </form>
  );
}
