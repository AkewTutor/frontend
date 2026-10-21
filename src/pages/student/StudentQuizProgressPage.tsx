import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMyCohorts } from '@/hooks/useCohort';
import { useQuizzesForCohort } from '@/hooks/useAssessmentQuiz';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import QuizTaker from '@/components/class-delivery/QuizTaker';
import type { Cohort } from '@/types';

export default function StudentQuizProgressPage() {
  const { user } = useAuth();
  if (user?.role === 'PARENT') {
    return <EmptyState message="Parent view not supported without child selection." />;
  }
  return <StudentView />;
}

function StudentView() {
  const { data, isLoading, error } = useMyCohorts();
  const [selected, setSelected] = useState<string | null>(null);
  const cohorts: Cohort[] = data?.cohorts ?? [];

  if (isLoading) return <div>Loading classes...</div>;
  if (error || cohorts.length === 0) return <EmptyState message="No cohorts found." />;

  const active = cohorts.find((c) => c.cohortId === selected) ?? cohorts[0];

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-xl font-semibold">My Progress</h1>
      {cohorts.length > 1 && (
        <div className="flex gap-2">
          {cohorts.map((c, i) => (
            <Button
              key={c.cohortId}
              onClick={() => setSelected(c.cohortId)}
              variant={active.cohortId === c.cohortId ? 'primary' : 'secondary'}
              size="sm"
            >
              {`Class ${i + 1}`}
            </Button>
          ))}
        </div>
      )}
      <CohortQuizzes cohort={active} />
    </div>
  );
}

function CohortQuizzes({ cohort }: { cohort: Cohort }) {
  const { data, isLoading, error } = useQuizzesForCohort(cohort.cohortId);
  const quizzes = data?.quizzes ?? [];

  if (isLoading) return <div>Loading assessments...</div>;
  if (error) return <EmptyState message="Could not load assessments." />;
  if (quizzes.length === 0) return <EmptyState message="No assessments yet for this class." />;

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => (
        <QuizTaker
          key={quiz.id}
          quiz={quiz}
          cohortId={cohort.cohortId}
          canSubmit={cohort.membershipStatus === 'ACTIVE'}
        />
      ))}
    </div>
  );
}