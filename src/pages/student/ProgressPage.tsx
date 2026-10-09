import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMyCohorts } from '@/hooks/useCohort';
import { useAssessmentsForStudent } from '@/hooks/useWeeklyAssessment';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

export interface MyCohortLocal {
  id: string;
  name?: string;
  subject?: string;
  cohortMembershipId: string;
}

export default function ProgressPage() {
  const { user } = useAuth();

  if (user?.role === 'PARENT') {
    return <EmptyState message="Parent view not supported without child selection." />;
  }

  return <StudentProgressView />;
}

// Split to avoid calling hook after early return
function StudentProgressView() {
  const { data, isLoading, error } = useMyCohorts();
  const cohorts = (data as MyCohortLocal[] | undefined) || [];

  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);

  if (isLoading) return <div>Loading cohorts...</div>;
  if (error || cohorts.length === 0) return <EmptyState message="No cohorts found." />;

  // Auto-select first cohort if none selected
  const activeCohortId = selectedCohortId || cohorts[0].id;
  const activeCohort = cohorts.find((c) => c.id === activeCohortId);

  return (
    <div className="progress-page">
      <h1>My Progress</h1>
      {cohorts.length > 1 && (
        <div className="cohort-tabs">
          {cohorts.map((c) => (
            <Button
              key={c.id}
              onClick={() => setSelectedCohortId(c.id)}
              variant={activeCohortId === c.id ? 'primary' : 'secondary'}
              size="sm"
            >
              {c.name || c.subject || 'Cohort'}
            </Button>
          ))}
        </div>
      )}

      {activeCohort && <CohortProgressView cohortMembershipId={activeCohort.cohortMembershipId} />}
    </div>
  );
}

function CohortProgressView({ cohortMembershipId }: { cohortMembershipId: string }) {
  const { data, isLoading, error } = useAssessmentsForStudent(cohortMembershipId);

  if (isLoading) return <div>Loading assessments...</div>;
  if (error || !data || data.assessments.length === 0) {
    return <EmptyState message="No assessments available for this cohort." />;
  }

  return (
    <div className="assessments-list">
      {data.assessments.map((a) => (
        <div key={a.id} className="assessment-card">
          <h3>Week of: {a.weekStartDate}</h3>
          <p>
            <strong>Feedback:</strong> {a.tutorFeedback}
          </p>
          {a.scoreSummary && (
            <p>
              <strong>Score:</strong> {a.scoreSummary}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
