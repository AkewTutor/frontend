import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRecordSessionMiss } from '@/hooks/useSessionMiss';
import type { SessionMissCausedBy, SessionMissType, RecordSessionMissResult } from '@/types';
import { Button } from '@/components/ui/button';

export interface RecordMissFormProps {
  initialSessionId?: string | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MISS_TYPES: { value: SessionMissType; label: string }[] = [
  { value: 'NO_SHOW', label: 'No Show' },
  { value: 'LATE_CANCELLATION', label: 'Late Cancellation' },
  { value: 'TECHNICAL_FAILURE', label: 'Technical Failure' },
];

export default function RecordMissForm({ initialSessionId }: RecordMissFormProps) {
  const [sessionId, setSessionId] = useState(initialSessionId || '');
  const [causedBy, setCausedBy] = useState<SessionMissCausedBy | ''>('');
  const [missType, setMissType] = useState<SessionMissType | ''>('');
  const [result, setResult] = useState<RecordSessionMissResult | null>(null);

  const { mutate, isPending, error } = useRecordSessionMiss();

  // A stale confirmation must never sit next to new input (8-4).
  const clearResult = () => {
    if (result) setResult(null);
  };

  const handleClear = () => {
    setSessionId('');
    setCausedBy('');
    setMissType('');
    setResult(null);
  };

  const onSessionIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSessionId(e.target.value);
    clearResult();
  };
  const onCausedByChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCausedBy(e.target.value as SessionMissCausedBy | '');
    clearResult();
  };
  const onMissTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setMissType(e.target.value as SessionMissType | '');
    clearResult();
  };

  const canSubmit = UUID_REGEX.test(sessionId) && causedBy !== '' && missType !== '';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    mutate(
      {
        sessionId,
        causedBy: causedBy as SessionMissCausedBy,
        missType: missType as SessionMissType,
      },
      { onSuccess: (data) => setResult(data) }
    );
  };

  const isConflict = error?.response?.status === 409;

  return (
    <div className="record-miss">
      {result && (
        <div className="record-miss-result">
          <h3>Session Miss Recorded</h3>
          {result.causedBy === 'TUTOR' && (
            <div>
              <p>
                <strong>Action:</strong> Tutor must make up the session.
              </p>
              <p>
                <strong>Deadline:</strong> {result.makeupDeadline}
              </p>
              <p>
                <strong>Earning Rate:</strong> {result.tutorEarningRateForMakeup}
              </p>
            </div>
          )}
          {result.causedBy === 'STUDENT' && (
            <div>
              <p>
                <strong>Action:</strong> No make-up or refund required.
              </p>
              <p>Tutor will be paid in full for this session.</p>
            </div>
          )}
          <Button type="button" onClick={handleClear} variant="secondary">
            Record Another
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="record-miss-form">
        <div className="form-group">
          <label htmlFor="miss-session-id">Session ID (UUID)</label>
          <input
            id="miss-session-id"
            value={sessionId}
            onChange={onSessionIdChange}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
          {error && isConflict && (
            <p role="alert" className="text-sm text-red-600">
              {error.message}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="miss-caused-by">Caused By</label>
          <select id="miss-caused-by" value={causedBy} onChange={onCausedByChange}>
            <option value="">Select...</option>
            <option value="TUTOR">Tutor</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="miss-type">Miss Type</label>
          <select id="miss-type" value={missType} onChange={onMissTypeChange}>
            <option value="">Select...</option>
            {MISS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" disabled={!canSubmit || isPending}>
          {isPending ? 'Recording...' : 'Record Miss'}
        </Button>
        {error && !isConflict && (
          <p role="alert" className="text-sm text-red-600">
            {error.message}
          </p>
        )}
      </form>
    </div>
  );
}
