import { useState } from 'react';
import { toast } from 'sonner';

import TutorVerificationCard from '@/components/accounts/TutorVerificationCard';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import {
  useApproveTutor,
  usePendingTutors,
  useRejectTutor,
} from '@/hooks/useAdminTutorVerification';

export default function TutorVerificationPage() {
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, isLoading, isError } = usePendingTutors(page);
  const approve = useApproveTutor();
  const reject = useRejectTutor();

  if (isLoading) return <p className="p-6">Loading pending tutors…</p>;
  if (isError || !data) {
    return <p className="p-6">We couldn&apos;t load pending tutors. Please try again later.</p>;
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Tutor verification</h1>

      {data.tutors.length === 0 ? (
        <EmptyState message="No tutors are waiting for review." />
      ) : (
        <ul className="flex flex-col gap-4">
          {data.tutors.map((tutor) => (
            <li key={tutor.id}>
              <TutorVerificationCard
                tutor={tutor}
                isBusy={busyId === tutor.id}
                onApprove={() => {
                  setBusyId(tutor.id);
                  approve.mutate(tutor.id, {
                    onSuccess: () => toast.success('Tutor approved.'),
                    onError: () => toast.error('Could not approve this tutor. Please try again.'),
                    onSettled: () => setBusyId(null),
                  });
                }}
                onReject={(reason) => {
                  setBusyId(tutor.id);
                  reject.mutate(
                    { tutorId: tutor.id, reason },
                    {
                      onSuccess: () => toast.success('Tutor rejected.'),
                      onError: () => toast.error('Could not reject this tutor. Please try again.'),
                      onSettled: () => setBusyId(null),
                    }
                  );
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-s">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
