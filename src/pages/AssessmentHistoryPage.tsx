import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { useAssessmentHistory, type AssessmentHistoryRow } from '@/hooks/useAssessmentQuiz';

interface StudentGroup {
  name: string;
  email: string | null;
  rows: AssessmentHistoryRow[];
}

export default function AssessmentHistoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(handle);
  }, [input]);

  const { data, isLoading, isError } = useAssessmentHistory({ q: isAdmin ? q : undefined });
  const rows = data?.history ?? [];

  const groups = new Map<string, StudentGroup>();
  for (const r of rows) {
    const g = groups.get(r.studentId) ?? { name: r.studentName, email: r.studentEmail, rows: [] };
    g.rows.push(r);
    groups.set(r.studentId, g);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Assessment history</h1>
      <p className="text-sm text-gray-600">
        {isAdmin
          ? 'All students, newest first. Includes attempts the tutor reset and quizzes that were later deleted.'
          : 'Your linked children, newest first. Includes earlier attempts that were reset for a retry.'}
      </p>

      {isAdmin && (
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by student email, phone or name"
          aria-label="Search assessment history"
        />
      )}

      {isLoading ? (
        <p data-testid="loading">Loading...</p>
      ) : isError ? (
        <p>Error loading assessment history</p>
      ) : groups.size === 0 ? (
        <p>No assessment history found.</p>
      ) : (
        Array.from(groups.entries()).map(([studentId, g]) => (
          <section key={studentId} className="space-y-2 rounded-lg border p-4">
            <h2 className="font-semibold">
              {g.name}
              {g.email && g.email !== g.name ? <span className="font-normal"> ({g.email})</span> : null}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Week</th>
                    <th className="p-2">Quiz</th>
                    <th className="p-2">Score</th>
                    <th className="p-2">Submitted</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => (
                    <tr key={r.attemptId} className="border-b">
                      <td className="p-2">{r.weekStartDate.slice(0, 10)}</td>
                      <td className="p-2">{r.quizTitle || 'Weekly assessment'}</td>
                      <td className="p-2">
                        {r.score} / {r.total}
                      </td>
                      <td className="p-2">{new Date(r.submittedAt).toLocaleDateString()}</td>
                      <td className="p-2">
                        {r.supersededAt ? 'Reset for retry' : 'Current'}
                        {r.quizDeleted ? ' (quiz deleted)' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}