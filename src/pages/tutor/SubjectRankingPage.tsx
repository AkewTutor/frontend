import { useState } from 'react';
import { toast } from 'sonner';

import SubjectRankingForm from '@/components/accounts/SubjectRankingForm';
import { useSubjects } from '@/hooks/useSubjects';
import { useRankSubjects } from '@/hooks/useTutorProfile';
import type { TutorSubjectRanking } from '@/types';

export default function SubjectRankingPage() {
  const { data, isLoading, isError } = useSubjects();
  const rank = useRankSubjects();
  const [saved, setSaved] = useState<TutorSubjectRanking[] | null>(null);

  if (isLoading) return <p className="p-6">Loading subjects…</p>;
  if (isError || !data) {
    return <p className="p-6">We couldn&apos;t load subjects. Please try again later.</p>;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">My subjects</h1>
      <p className="text-m text-muted-foreground">
        Choose up to two subjects and rank them. Saving replaces your previous ranking.
      </p>
      {saved && (
        <p className="text-s" role="status">
          Saved ranking: {saved.map((s) => `${s.rank}. ${s.subjectName}`).join(', ')}
        </p>
      )}
      <SubjectRankingForm
        subjects={data.subjects}
        currentRankings={[]}
        onSave={(ranked) =>
          rank.mutate(ranked, {
            onSuccess: (res) => {
              setSaved(res.subjects);
              toast.success('Subject ranking saved.');
            },
            onError: (error) => {
              const status = (error as { response?: { status?: number } }).response?.status;
              toast.error(
                status === 400
                  ? 'Each subject can be ranked once, with unique ranks.'
                  : 'Could not save your ranking. Please try again.'
              );
            },
          })
        }
      />
    </div>
  );
}
