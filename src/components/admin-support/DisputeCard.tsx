import { useId, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { generatePath, Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import type { DisputeDetail, ResolveDisputeInput } from '@/hooks/useAdminDisputes';
import type { ResolutionAction } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export type DisputeResolutionBody = Omit<ResolveDisputeInput, 'complaintId'>;

export interface DisputeCardProps {
  complaint: DisputeDetail;
  onResolve: (body: DisputeResolutionBody) => void;
  isSubmitting?: boolean;
}

type FormStatus = ResolveDisputeInput['status'];

const STATUS_OPTIONS: { value: FormStatus; label: string }[] = [
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
];

const ACTION_OPTIONS: { value: ResolutionAction; label: string }[] = [
  { value: 'NO_ACTION', label: 'No action' },
  { value: 'WARNING_ISSUED', label: 'Warning issued' },
  { value: 'REFUND_ISSUED', label: 'Refund issued' },
  { value: 'TUTOR_SUSPENDED', label: 'Tutor suspended' },
];

const FIELD_CLASS =
  'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60';

export default function DisputeCard({
  complaint,
  onResolve,
  isSubmitting = false,
}: DisputeCardProps) {
  const uid = useId();
  const [status, setStatus] = useState<FormStatus>('UNDER_REVIEW');
  const [action, setAction] = useState<ResolutionAction | ''>('');
  const [membershipId, setMembershipId] = useState('');
  const [notes, setNotes] = useState('');

  const isClosed = complaint.status === 'RESOLVED' || complaint.status === 'DISMISSED';
  const candidates = complaint.candidateMemberships ?? [];

  // UX guards only. The backend enforces the same rules and stays the source of truth (8-8).
  const canSuspend = Boolean(complaint.relatedCohortId || complaint.relatedSessionId);
  const canRefund = candidates.some((m) => m.refundPreviewAmount !== null);
  const selectedMembership = candidates.find((m) => m.id === membershipId);

  const onStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as FormStatus;
    setStatus(next);
    if (next !== 'RESOLVED') {
      setAction('');
      setMembershipId('');
    }
  };

  const onActionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setAction(e.target.value as ResolutionAction | '');
    setMembershipId('');
  };

  const needsAction = status === 'RESOLVED' && action === '';
  const needsMembership = action === 'REFUND_ISSUED' && membershipId === '';
  const canSubmit = !isSubmitting && notes.trim() !== '' && !needsAction && !needsMembership;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    // The refund amount is always server-computed (H4 fix): only the membership id is sent.
    const body: DisputeResolutionBody = {
      status,
      resolutionNotes: notes.trim(),
      ...(status === 'RESOLVED' && action !== '' ? { resolutionAction: action } : {}),
      ...(action === 'REFUND_ISSUED' ? { affectedCohortMembershipId: membershipId } : {}),
    };
    onResolve(body);
  };

  return (
    <article className="space-y-4 rounded-lg border border-neutral-200 p-4">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{complaint.category.replace(/_/g, ' ')}</h3>
        <StatusBadge status={complaint.status} />
        <span className="text-sm text-neutral-600">
          Reported by {complaint.reporterRole.toLowerCase()} on{' '}
          {new Date(complaint.createdAt).toLocaleDateString()}
        </span>
      </header>

      <p className="whitespace-pre-wrap text-sm">{complaint.description}</p>

      <ul className="space-y-1 text-sm">
        {complaint.relatedThreadId && (
          <li>
            <Link
              className="underline"
              to={generatePath(ROUTES.ADMIN_MESSAGE_THREAD, {
                threadId: complaint.relatedThreadId,
              })}
            >
              Review message thread
            </Link>
          </li>
        )}
        {complaint.relatedSessionId && (
          <li>
            <Link
              className="underline"
              to={`${ROUTES.ADMIN_SESSION_MISSES}?sessionId=${encodeURIComponent(complaint.relatedSessionId)}`}
            >
              Record a miss
            </Link>
          </li>
        )}
        {complaint.relatedCohortId && <li>Cohort: {complaint.relatedCohortId}</li>}
        {complaint.relatedPaymentId && <li>Payment: {complaint.relatedPaymentId}</li>}
      </ul>

      {isClosed ? (
        <section aria-label="Resolution outcome" className="text-sm">
          <p>
            Outcome:{' '}
            {complaint.resolutionAction ? complaint.resolutionAction.replace(/_/g, ' ') : 'None'}
          </p>
          {complaint.resolutionNotes && <p>Notes: {complaint.resolutionNotes}</p>}
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3" aria-label="Resolve dispute">
          <div className="space-y-1">
            <Label htmlFor={`${uid}-status`}>Status</Label>
            <select
              id={`${uid}-status`}
              className={FIELD_CLASS}
              value={status}
              onChange={onStatusChange}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor={`${uid}-action`}>Resolution action</Label>
            <select
              id={`${uid}-action`}
              className={FIELD_CLASS}
              value={action}
              onChange={onActionChange}
              disabled={status !== 'RESOLVED'}
            >
              <option value="">Select an action</option>
              {ACTION_OPTIONS.map((o) => (
                <option
                  key={o.value}
                  value={o.value}
                  disabled={
                    (o.value === 'REFUND_ISSUED' && !canRefund) ||
                    (o.value === 'TUTOR_SUSPENDED' && !canSuspend)
                  }
                >
                  {o.label}
                </option>
              ))}
            </select>
            {!canRefund && (
              <p className="text-xs text-neutral-600">
                {candidates.length === 0
                  ? 'Refund unavailable: no student membership could be identified for this complaint.'
                  : 'Refund unavailable: no linked student has a paid billing cycle with sessions left to refund.'}
              </p>
            )}
            {!canSuspend && (
              <p className="text-xs text-neutral-600">
                Suspension unavailable: this complaint is not linked to a cohort or session with an
                identifiable tutor.
              </p>
            )}
          </div>

          {action === 'REFUND_ISSUED' && (
            <div className="space-y-1">
              <Label htmlFor={`${uid}-membership`}>Affected student</Label>
              <select
                id={`${uid}-membership`}
                className={FIELD_CLASS}
                value={membershipId}
                onChange={(e) => setMembershipId(e.target.value)}
              >
                <option value="">Select a student</option>
                {candidates.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.refundPreviewAmount === null}>
                    {m.studentDisplayName}
                    {m.refundPreviewAmount === null
                      ? m.hasActivePaidCycle
                        ? ' (nothing left to refund)'
                        : ' (no paid billing cycle)'
                      : ''}
                  </option>
                ))}
              </select>
              {selectedMembership?.refundPreviewAmount != null && (
                <p data-testid="refund-preview" className="text-sm">
                  Refund preview (read-only, calculated by the server): ETB{' '}
                  {selectedMembership.refundPreviewAmount}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor={`${uid}-notes`}>Resolution notes</Label>
            <textarea
              id={`${uid}-notes`}
              className={FIELD_CLASS}
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
            Submit resolution
          </Button>
        </form>
      )}
    </article>
  );
}
