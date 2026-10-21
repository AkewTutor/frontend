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
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handle = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(handle);
  }, [input]);

  const { data, isLoading, isError } = useAssessmentHistory({ q: isAdmin ? q : undefined });
  const rows = data?.history ?? [];

  const groupMap = new Map<string, StudentGroup>();
  for (const r of rows) {
    const g = groupMap.get(r.studentId) ?? { name: r.studentName, email: r.studentEmail, rows: [] };
    g.rows.push(r);
    groupMap.set(r.studentId, g);
  }
  // Organised by student name (or email when there is no name), A to Z.
  const groups = Array.from(groupMap.entries()).sort((a, b) =>
    a[1].name.localeCompare(b[1].name, undefined, { sensitivity: 'base' })
  );

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Assessment history</h1>
      <p className="text-sm text-gray-600">
        {isAdmin
          ? 'Students A to Z. Click a student to see every attempt, including ones the tutor reset and quizzes that were later deleted.'
          : 'Your linked children A to Z. Click a child to see every attempt, including earlier attempts that were reset for a retry.'}
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
      ) : groups.length === 0 ? (
        <p>No assessment history found.</p>
      ) : (
        groups.map(([studentId, g]) => {
          const isOpen = !!open[studentId];
          const latest = g.rows[0];
          return (
            <section key={studentId} className="rounded-lg border">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggle(studentId)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span>
                  <span className="font-semibold">{g.name}</span>
                  {g.email && g.email !== g.name ? (
                    <span className="text-sm"> ({g.email})</span>
                  ) : null}
                </span>
                <span className="text-sm text-gray-600">
                  {g.rows.length} attempt{g.rows.length === 1 ? '' : 's'} - latest {latest.score} /{' '}
                  {latest.total} - {isOpen ? 'Hide history' : 'Show history'}
                </span>
              </button>
              {isOpen && (
                <div className="overflow-x-auto border-t p-4">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2">Week</th>
                        <th className="p-2">Quiz</th>
                        <th className="p-2">Tutor</th>
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
                            {r.tutorName}
                            {r.tutorEmail && r.tutorEmail !== r.tutorName ? (
                              <span className="block text-xs text-gray-500">{r.tutorEmail}</span>
                            ) : null}
                          </td>
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
              )}
            </section>
          );
        })
      )}
    </div>
  );
}