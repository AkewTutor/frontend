import { useParams } from 'react-router-dom';
import { useCohortMembers } from '@/hooks/useCohort';
import { useAssessmentsForStudent } from '@/hooks/useWeeklyAssessment';
import EmptyState from '@/components/common/EmptyState';
import AssessmentForm from '@/components/class-delivery/AssessmentForm';

export interface CohortMemberLocal {
  studentId: string;
  firstName: string;
  grade: string;
  cohortMembershipId: string;
}

export interface CohortMembersResponse {
  cohortId: string;
  format: string;
  students: CohortMemberLocal[];
}

function getMondayOfCurrentWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
}

export default function WeeklyAssessmentPage() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const { data, isLoading, error } = useCohortMembers(cohortId || '');
  const membersData = data as CohortMembersResponse | undefined;

  if (isLoading) return <div>Loading...</div>;
  if (error || !membersData) return <EmptyState message="Cohort members not found." />;
  if (membersData.students.length === 0)
    return <EmptyState message="No students in this cohort." />;

  return (
    <div className="weekly-assessment-page">
      <h1>Weekly Assessments</h1>
      {membersData.students.map((student) => (
        <StudentAssessmentSection key={student.studentId} student={student} />
      ))}
    </div>
  );
}

// One section (own hook + own form) per student, so submissions are independent.
function StudentAssessmentSection({ student }: { student: CohortMemberLocal }) {
  const { data: assessmentsData, isLoading } = useAssessmentsForStudent(student.cohortMembershipId);

  if (isLoading) return <div>Loading assessments...</div>;

  const currentWeekMonday = getMondayOfCurrentWeek();
  const assessments = assessmentsData?.assessments ?? [];
  const existingAssessment = assessments.find((a) => a.weekStartDate === currentWeekMonday);

  return (
    <section className="student-assessment-view">
      <h2>Assessment for {student.firstName}</h2>
      <AssessmentForm
        cohortMembershipId={student.cohortMembershipId}
        weekStartDate={currentWeekMonday}
        existingAssessment={existingAssessment}
      />
      <div className="past-assessments">
        <h3>Past Assessments</h3>
        {assessments
          .filter((a) => a.weekStartDate !== currentWeekMonday)
          .map((a) => (
            <div key={a.id} className="assessment-card">
              <p>
                <strong>Week of:</strong> {a.weekStartDate}
              </p>
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
    </section>
  );
}
