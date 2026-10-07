import { useState } from 'react';

import EmptyState from '@/components/common/EmptyState';
import MessageThreadView from '@/components/messaging/MessageThreadView';
import { Button } from '@/components/ui/button';
import { useMyCohorts } from '@/hooks/useCohort';
import type { CohortFormat } from '@/types';

const FORMAT_LABEL: Record<CohortFormat, string> = {
  ONE_TO_ONE: '1-to-1',
  ONE_TO_THREE: '1-to-3 group',
  ONE_TO_FIVE: '1-to-5 group',
};

export default function MessagingPage() {
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const { data, isLoading, isError } = useMyCohorts();

  if (isLoading) return <p className="p-6">Loading…</p>;
  if (isError || !data) {
    return <p className="p-6">We couldn&apos;t load your conversations. Please try again later.</p>;
  }

  const active = data.cohorts.filter((cohort) => cohort.status === 'ACTIVE');

  if (active.length === 0) {
    return (
      <div className="p-6">
        <EmptyState message="You have no active class yet." />
      </div>
    );
  }

  // Exactly one active cohort: no picker step (8-5). Derived, not synced through an effect.
  const cohortId = active.length === 1 ? active[0].cohortId : selectedCohortId;

  return (
    <div className="flex flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Messages</h1>
      {cohortId ? (
        <>
          {active.length > 1 && (
            <div>
              <Button variant="outline" onClick={() => setSelectedCohortId(null)}>
                Back to conversations
              </Button>
            </div>
          )}
          <MessageThreadView cohortId={cohortId} />
        </>
      ) : (
        <ul className="flex flex-col gap-2">
          {active.map((cohort, index) => (
            <li key={cohort.cohortId}>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setSelectedCohortId(cohort.cohortId)}
              >
                Class {index + 1} · {FORMAT_LABEL[cohort.format]}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
