import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCohortMembers } from '@/hooks/useCohort';
import {
  useQuizzesForCohort,
  useDeleteQuiz,
  useResetAttempt,
  type Quiz,
} from '@/hooks/useAssessmentQuiz';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
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
  const deleteQuiz = useDeleteQuiz();
  const resetAttempt = useResetAttempt();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);

  const members = membersQuery.data as unknown as MembersResponseLocal | undefined;

  if (membersQuery.isLoading) return <div>Loading...</div>;
  if (membersQuery.error || !members) return <EmptyState message="Cohort members not found." />;

  const quizzes: Quiz[] = quizzesQuery.data?.quizzes ?? [];

  const renderResults = (quiz: Quiz) => {
    const attempts = quiz.attempts ?? [];
    return (
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-1">Student</th>
            <th className="py-1">Score</th>
            <th className="py-1">Earlier attempts</th>
            <th className="py-1" />
          </tr>
        </thead>
        <tbody>
          {members.students.map((s) => {
            const active = attempts.find((a) => a.studentId === s.studentId && !a.supersededAt);
            const earlier = attempts.filter((a) => a.studentId === s.studentId && a.supersededAt);
            return (
              <tr key={s.studentId} className="border-t">
                <td className="py-1">{s.firstName}</td>
                <td className="py-1">
                  {active ? `${active.score} / ${active.total}` : 'Not submitted'}
                </td>
                <td className="py-1">
                  {earlier.length === 0 ? '-' : earlier.map((a) => `${a.score}/${a.total}`).join(', ')}
                </td>
                <td className="py-1 text-right">
                  {active &&
                    (confirmResetId === active.id ? (
                      <span className="space-x-1">
                        <span>Let {s.firstName} retry?</span>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={resetAttempt.isPending}
                          onClick={() => {
                            resetAttempt.mutate({ attemptId: active.id, cohortId });
                            setConfirmResetId(null);
                          }}
                        >
                          Yes, reset
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmResetId(null)}>
                          No
                        </Button>
                      </span>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => setConfirmResetId(active.id)}>
                        Allow retry
                      </Button>
                    ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Quizzes and scores</h2>
        {quizzesQuery.isLoading && <div>Loading quizzes...</div>}
        {!quizzesQuery.isLoading && quizzes.length === 0 && (
          <p className="text-sm text-gray-600">No quizzes created yet. Create one below.</p>
        )}
        {quizzes.map((quiz) => {
          const submitted = (quiz.attempts ?? []).length > 0;
          if (editingId === quiz.id) {
            return (
              <QuizBuilder
                key={quiz.id}
                cohortId={cohortId}
                defaultWeekStartDate={getMondayOfCurrentWeek()}
                editing={quiz}
                questionsLocked={submitted}
                onDone={() => setEditingId(null)}
              />
            );
          }
          return (
            <article key={quiz.id} className="space-y-2 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">
                  {quiz.title || 'Weekly assessment'} - week of {quiz.weekStartDate.slice(0, 10)}
                </h3>
                {confirmDeleteId === quiz.id ? (
                  <span className="space-x-1 text-sm">
                    <span>Delete this quiz? Results stay in admin history.</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleteQuiz.isPending}
                      onClick={() => {
                        deleteQuiz.mutate({ quizId: quiz.id, cohortId });
                        setConfirmDeleteId(null);
                      }}
                    >
                      Yes, delete
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                      Cancel
                    </Button>
                  </span>
                ) : (
                  <span className="space-x-1">
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(quiz.id)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDeleteId(quiz.id)}>
                      Delete
                    </Button>
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm">{quiz.instructions}</p>
              <div className="space-y-2">
                {quiz.questions.map((q, qi) => (
                  <div key={qi}>
                    <p className="font-medium">
                      Question {qi + 1}: {q.text}
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
              <h4 className="pt-2 font-medium">
                Results ({new Set((quiz.attempts ?? []).filter((a) => !a.supersededAt).map((a) => a.studentId)).size}{' '}
                of {members.students.length} submitted)
              </h4>
              {renderResults(quiz)}
            </article>
          );
        })}
      </section>

      <QuizBuilder cohortId={cohortId} defaultWeekStartDate={getMondayOfCurrentWeek()} />
    </div>
  );
}