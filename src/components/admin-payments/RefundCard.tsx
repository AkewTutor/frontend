import { useState } from 'react';

import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney } from '@/lib/money';
import type { RefundCase } from '@/types';

interface RefundCardProps {
  refund: RefundCase;
  onApprove: () => void;
  onReject: (rejectionReason: string) => void;
  isBusy?: boolean;
}

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : '');
const humanize = (text: string) => text.replace(/_/g, ' ').toLowerCase();

// Figures are rendered exactly as returned; nothing is recomputed client-side.
export default function RefundCard({
  refund,
  onApprove,
  onReject,
  isBusy = false,
}: RefundCardProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submitReject = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('A rejection reason is required.');
      return;
    }
    setError(null);
    onReject(trimmed);
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-m font-semibold">{formatMoney(refund.amount)}</span>
            <span className="text-s capitalize text-muted-foreground">
              {humanize(refund.reason)}
            </span>
          </div>
          <StatusBadge status={refund.status} />
        </div>

        <ul className="text-s text-muted-foreground">
          <li>Payment: {refund.paymentId}</li>
          <li>
            Sessions remaining: {refund.sessionsRemaining} of {refund.totalSessionsBilled}
          </li>
          <li>Created: {date(refund.createdAt)}</li>
        </ul>

        {refund.status === 'APPROVED' && (
          <p className="text-s">
            Approved by {refund.approvedById} on {date(refund.approvedAt)}
          </p>
        )}
        {refund.status === 'REJECTED' && (
          <div className="text-s">
            <p>
              Rejected by {refund.rejectedById} on {date(refund.rejectedAt)}
            </p>
            <p>Reason: {refund.rejectionReason}</p>
          </div>
        )}

        {refund.status === 'PENDING' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                aria-label={`Approve refund ${refund.id}`}
                disabled={isBusy}
                onClick={onApprove}
              >
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                aria-label={`Reject refund ${refund.id}`}
                disabled={isBusy}
                onClick={() => setRejecting((v) => !v)}
              >
                Reject
              </Button>
            </div>

            {rejecting && (
              <div className="flex flex-col gap-2">
                <Textarea
                  aria-label="Rejection reason"
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                {error && (
                  <p role="alert" className="text-s text-danger">
                    {error}
                  </p>
                )}
                <div>
                  <Button type="button" size="sm" disabled={isBusy} onClick={submitReject}>
                    Confirm reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
