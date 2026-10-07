import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants';
import { useRequestFormatSwitch } from '@/hooks/useFormatSwitch';
import type { CohortFormat } from '@/types';

const FORMATS: CohortFormat[] = ['ONE_TO_ONE', 'ONE_TO_THREE', 'ONE_TO_FIVE'];

const FORMAT_LABEL: Record<CohortFormat, string> = {
  ONE_TO_ONE: '1-to-1',
  ONE_TO_THREE: '1-to-3 group',
  ONE_TO_FIVE: '1-to-5 group',
};

// Inferred from the single doc example (ONE_TO_ONE -> ONE_TO_THREE).
const NEXT_FORMAT: Record<CohortFormat, CohortFormat> = {
  ONE_TO_ONE: 'ONE_TO_THREE',
  ONE_TO_THREE: 'ONE_TO_FIVE',
  ONE_TO_FIVE: 'ONE_TO_ONE',
};

interface SwitchState {
  cohortId: string;
  format: CohortFormat;
}

function readState(state: unknown): SwitchState | null {
  if (!state || typeof state !== 'object') return null;
  const { cohortId, format } = state as Partial<SwitchState>;
  if (typeof cohortId !== 'string' || !cohortId) return null;
  if (!format || !FORMATS.includes(format)) return null;
  return { cohortId, format };
}

function SwitchForm({ cohortId, format }: SwitchState) {
  const [targetFormat, setTargetFormat] = useState<CohortFormat>(NEXT_FORMAT[format]);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const { mutate, isPending } = useRequestFormatSwitch();

  if (done) {
    return (
      <div className="flex flex-col items-start gap-3" role="status">
        <p>Your format switch request has been submitted.</p>
        <Button asChild>
          <Link to={ROUTES.STUDENT_GROUP_STATUS}>Back to group status</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = () => {
    setFailed(false);
    mutate(
      { cohortId, targetFormat },
      { onSuccess: () => setDone(true), onError: () => setFailed(true) }
    );
  };

  return (
    <div className="flex max-w-md flex-col gap-4">
      <p>
        Current format: <strong>{FORMAT_LABEL[format]}</strong>
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="target-format">Target format</Label>
        <select
          id="target-format"
          value={targetFormat}
          onChange={(e) => setTargetFormat(e.target.value as CohortFormat)}
          className="h-10 rounded-md border border-input bg-background px-3"
        >
          {FORMATS.filter((f) => f !== format).map((f) => (
            <option key={f} value={f}>
              {FORMAT_LABEL[f]}
            </option>
          ))}
        </select>
      </div>
      <p className="text-s text-muted-foreground">
        Switching cancels your current match and starts a new search under the new format.
      </p>
      {failed && (
        <p role="alert" className="text-destructive">
          We couldn&apos;t submit your request. Please try again.
        </p>
      )}
      <div>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Submitting…' : 'Request switch'}
        </Button>
      </div>
    </div>
  );
}

export default function FormatSwitchPage() {
  const { state } = useLocation();
  const switchState = readState(state);

  return (
    <div className="flex flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Request a format switch</h1>
      {switchState ? (
        <SwitchForm {...switchState} />
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p>Open this page from your group status to choose which group to switch.</p>
          <Button asChild variant="outline">
            <Link to={ROUTES.STUDENT_GROUP_STATUS}>Go to group status</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
