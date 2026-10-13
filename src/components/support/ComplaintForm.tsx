import { useId, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { useFileComplaint } from '@/hooks/useComplaints';
import type { FileComplaintInput } from '@/hooks/useComplaints';
import { useUpcomingSessions } from '@/hooks/useSessions';
import { useMyPayments } from '@/hooks/usePayments';
import { useMyCohorts } from '@/hooks/useCohort';
import { useAuthStore } from '@/store/auth.store';
import type { ComplaintCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const CATEGORY_OPTIONS: { value: ComplaintCategory; label: string }[] = [
  { value: 'SESSION_ISSUE', label: 'Session issue' },
  { value: 'TUTOR_CONDUCT', label: 'Tutor conduct' },
  { value: 'PAYMENT_ISSUE', label: 'Payment issue' },
  { value: 'MESSAGE_ISSUE', label: 'Message issue' },
  { value: 'OTHER', label: 'Other' },
];

const MIN_DESCRIPTION = 10;
const MAX_DESCRIPTION = 2000;

const FIELD_CLASS =
  'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60';

const humanize = (v: string) => {
  const s = v.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

interface PickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

// Each picker owns its hook, so a role that cannot call the endpoint never renders it.
// Options come only from the caller's own lists: there is no free-text id entry.
function SessionPicker({ id, value, onChange }: PickerProps) {
  const { data } = useUpcomingSessions();
  const sessions = data?.sessions ?? [];
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>Related session</Label>
      <select
        id={id}
        className={FIELD_CLASS}
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      >
        <option value="">None</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {new Date(s.scheduledStart).toLocaleString()} · {humanize(s.status)}
          </option>
        ))}
      </select>
    </div>
  );
}

function PaymentPicker({ id, value, onChange }: PickerProps) {
  const { data } = useMyPayments();
  const payments = data?.payments ?? [];
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>Related payment</Label>
      <select
        id={id}
        className={FIELD_CLASS}
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      >
        <option value="">None</option>
        {payments.map((p) => (
          <option key={p.id} value={p.id}>
            {p.amount} ETB · {new Date(p.createdAt).toLocaleDateString()} · {humanize(p.status)}
          </option>
        ))}
      </select>
    </div>
  );
}

function CohortPicker({ id, value, onChange }: PickerProps) {
  const { data } = useMyCohorts();
  const cohorts = data?.cohorts ?? [];
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>Related class</Label>
      <select
        id={id}
        className={FIELD_CLASS}
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      >
        <option value="">None</option>
        {cohorts.map((c) => (
          <option key={c.cohortId} value={c.cohortId}>
            {humanize(c.format)} · {humanize(c.status)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ComplaintForm() {
  const uid = useId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const { mutate, isPending, error } = useFileComplaint();

  const [category, setCategory] = useState<ComplaintCategory | ''>('');
  const [description, setDescription] = useState('');
  const [relatedSessionId, setSessionId] = useState('');
  const [relatedPaymentId, setPaymentId] = useState('');
  const [relatedCohortId, setCohortId] = useState('');

  // Pickers per role (docs silent): Student all three, Tutor sessions only. Parents need a
  // child selection that does not exist yet, so they may file with "Other" only.
  const showSessions = role === 'STUDENT' || role === 'TUTOR';
  const showStudentOnly = role === 'STUDENT';

  const length = description.trim().length;
  const descriptionValid = length >= MIN_DESCRIPTION && length <= MAX_DESCRIPTION;
  const hasRelated = !!(relatedSessionId || relatedPaymentId || relatedCohortId);
  // Mirrors the backend 400 rule: a related entity unless the category is OTHER.
  const ruleSatisfied = category === 'OTHER' || hasRelated;
  const canSubmit = !isPending && category !== '' && descriptionValid && ruleSatisfied;

  const descriptionError =
    description.length > 0 && !descriptionValid
      ? length < MIN_DESCRIPTION
        ? `Description must be at least ${MIN_DESCRIPTION} characters.`
        : `Description must be at most ${MAX_DESCRIPTION} characters.`
      : null;

  const apiMessage = (error as AxiosError<{ message?: string }> | null)?.response?.data?.message;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const body: FileComplaintInput = { category, description: description.trim() };
    if (relatedSessionId) body.relatedSessionId = relatedSessionId;
    if (relatedPaymentId) body.relatedPaymentId = relatedPaymentId;
    if (relatedCohortId) body.relatedCohortId = relatedCohortId;
    mutate(body, {
      onSuccess: () => {
        toast.success('Complaint submitted. We will review it shortly.');
        // Navigating to the same route does not remount the history list, so refresh it here.
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_COMPLAINTS] });
        setCategory('');
        setDescription('');
        setSessionId('');
        setPaymentId('');
        setCohortId('');
        navigate(ROUTES.COMPLAINTS);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-space-md" noValidate>
      <div className="space-y-1">
        <Label htmlFor={`${uid}-category`}>Category</Label>
        <select
          id={`${uid}-category`}
          className={FIELD_CLASS}
          value={category}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setCategory(e.target.value as ComplaintCategory | '')
          }
        >
          <option value="">Select a category</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`${uid}-description`}>Description</Label>
        <textarea
          id={`${uid}-description`}
          className={FIELD_CLASS}
          rows={5}
          value={description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
        />
        {descriptionError && (
          <p role="alert" className="text-sm text-destructive">
            {descriptionError}
          </p>
        )}
      </div>

      {showSessions && (
        <SessionPicker id={`${uid}-session`} value={relatedSessionId} onChange={setSessionId} />
      )}
      {showStudentOnly && (
        <>
          <PaymentPicker id={`${uid}-payment`} value={relatedPaymentId} onChange={setPaymentId} />
          <CohortPicker id={`${uid}-cohort`} value={relatedCohortId} onChange={setCohortId} />
        </>
      )}
      {role === 'PARENT' && (
        <p className="text-sm text-muted-foreground">
          Choose "Other" to describe your issue. Linking a specific class or payment is not
          available yet.
        </p>
      )}

      {category !== '' && !ruleSatisfied && (
        <p className="text-sm text-muted-foreground">
          Select the related item above, or choose the "Other" category.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {apiMessage ?? 'Could not submit your complaint. Please try again.'}
        </p>
      )}

      <Button type="submit" disabled={!canSubmit} loading={isPending}>
        Submit complaint
      </Button>
    </form>
  );
}
