import { useParams } from 'react-router-dom';
import { useCohortMembers } from '@/hooks/useCohort';
import { useQuizzesForCohort } from '@/hooks/useAssessmentQuiz';
import EmptyState from '@/components/common/EmptyState';
import QuizBuilder from '@/components/class-delivery/QuizBuilder';

interface MemberLocal {
  studentId: string;
  firstName: string;
  grade: string | number;
  cohortMembershipId: string;
}

interface MembersResponseLocal {
  cohortId: string;
  format: string;
  students: MemberLocal[];
}

function getMondayOfCurrentWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
}

export default function QuizAssessmentPage() {
  const { cohortId = '' } = useParams<{ cohortId: string }>();
  const membersQuery = useCohortMembers(cohortId);
  const quizzesQuery = useQuizzesForCohort(cohortId);
  const members = membersQuery.data as unknown as MembersResponseLocal | undefined;

  if (membersQuery.isLoading) return <div>Loading...</div>;
  if (membersQuery.error || !members) return <EmptyState message="Cohort members not found." />;

  const quizzes = quizzesQuery.data?.quizzes ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <header className="rounded-lg border p-4">
        <h1 className="text-xl font-semibold">Weekly Assessment</h1>
        <p className="text-sm text-gray-600">
          Class format: {members.format} - {members.students.length} student
          {members.students.length === 1 ? '' : 's'}
        </p>
        <p className="mt-1 text-sm">
          <strong>For:</strong>{' '}
          {members.students.length === 0
            ? 'No students yet'
            : members.students.map((s) => `${s.firstName} (Grade ${s.grade})`).join(', ')}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          One quiz per class per week. Every student in this class answers the same quiz.
        </p>
      </header>

      <QuizBuilder cohortId={cohortId} defaultWeekStartDate={getMondayOfCurrentWeek()} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Past quizzes</h2>
        {quizzesQuery.isLoading && <div>Loading quizzes...</div>}
        {!quizzesQuery.isLoading && quizzes.length === 0 && (
          <p className="text-sm text-gray-600">No quizzes created yet.</p>
        )}
        {quizzes.map((quiz) => {
          const attempts = quiz.attempts ?? [];
          return (
            <details key={quiz.id} className="rounded border p-3">
              <summary className="cursor-pointer font-medium">
                {quiz.title || 'Weekly assessment'} - week of {quiz.weekStartDate.slice(0, 10)} (
                {attempts.length} of {members.students.length} submitted)
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-sm">{quiz.instructions}</p>
              <div className="mt-3 space-y-2">
                {quiz.questions.map((q, qi) => (
                  <div key={qi}>
                    <p className="font-medium">
                      {qi + 1}. {q.text}
                    </p>
                    {q.options.map((o, oi) => (
                      <p key={oi} className="text-sm">
                        {o.isCorrect ? '[x] ' : '[ ] '}
                        {o.text}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
              <h3 className="mt-3 font-medium">Results</h3>
              {attempts.length === 0 ? (
                <p className="text-sm text-gray-600">No submissions yet.</p>
              ) : (
                <ul className="text-sm">
                  {attempts.map((a) => (
                    <li key={a.id}>
                      {a.studentName}: {a.score} / {a.total}
                    </li>
                  ))}
                </ul>
              )}
            </details>
          );
        })}
      </section>
    </div>
  );
}