import { useState } from 'react';

import LeaderboardTable from '@/components/gamification/LeaderboardTable';
import StudentScope from '@/components/gamification/StudentScope';
import { Button } from '@/components/ui/button';
import { useLeaderboard } from '@/hooks/useGamification';

type Period = 'WEEKLY' | 'MONTHLY';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

function LeaderboardContent({
  period,
  studentId,
}: {
  period: Period;
  studentId: string | undefined;
}) {
  const { data, isLoading, isError } = useLeaderboard(period, studentId);

  if (isLoading) return <p role="status">Loading…</p>;
  if (isError || !data) return <p role="alert">Could not load the leaderboard.</p>;

  return (
    <div className="flex flex-col gap-space-md">
      <p className="text-s text-muted-foreground">Grade {data.grade}</p>
      <LeaderboardTable rankings={data.rankings} callerRank={data.callerRank} />
    </div>
  );
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('WEEKLY');

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Leaderboard</h1>
      <div role="group" aria-label="Period" className="flex gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            type="button"
            size="sm"
            variant={period === p.value ? 'default' : 'outline'}
            aria-pressed={period === p.value}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <StudentScope>
        {(studentId) => <LeaderboardContent period={period} studentId={studentId} />}
      </StudentScope>
    </div>
  );
}