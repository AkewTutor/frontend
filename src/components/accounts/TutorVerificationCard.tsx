import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PendingTutor } from '@/types';

interface TutorVerificationCardProps {
  tutor: PendingTutor;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isBusy?: boolean;
}

const orDash = (value: string | null) => value?.trim() || 'Not provided';

export default function TutorVerificationCard({
  tutor,
  onApprove,
  onReject,
  isBusy = false,
}: TutorVerificationCardProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  return (
    <article className="space-y-3 rounded-m border border-border p-4">
      <dl className="space-y-1 text-m">
        <div>
          <dt className="text-s text-muted-foreground">Education</dt>
          <dd>{orDash(tutor.educationInstitution)}</dd>
        </div>
        <div>
          <dt className="text-s text-muted-foreground">Experience</dt>
          <dd>{orDash(tutor.experienceDescription)}</dd>
        </div>
        <div>
          <dt className="text-s text-muted-foreground">Applied</dt>
          <dd>{new Date(tutor.createdAt).toLocaleDateString()}</dd>
        </div>
      </dl>

      {rejecting ? (
        <div className="space-y-2">
          <Label htmlFor={`reject-reason-${tutor.id}`}>Rejection reason</Label>
          <Input
            id={`reject-reason-${tutor.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="button" disabled={!trimmed || isBusy} onClick={() => onReject(trimmed)}>
              Confirm reject
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setRejecting(false);
                setReason('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button type="button" disabled={isBusy} onClick={onApprove}>
            Approve
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isBusy}
            onClick={() => setRejecting(true)}
          >
            Reject
          </Button>
        </div>
      )}
    </article>
  );
}
