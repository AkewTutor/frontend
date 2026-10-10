import { faFlagCheckered } from '@fortawesome/free-solid-svg-icons';

import EmptyState from '@/components/common/EmptyState';
import ChallengeCard from '@/components/gamification/ChallengeCard';
import StudentScope from '@/components/gamification/StudentScope';
import { useActiveChallenges, useMyChallengeProgress } from '@/hooks/useChallenges';

function ChallengesContent({ studentId }: { studentId: string | undefined }) {
  const active = useActiveChallenges();
  const mine = useMyChallengeProgress(studentId);

  if (active.isLoading || mine.isLoading) return <p role="status">Loading…</p>;
  if (active.isError || mine.isError || !active.data || !mine.data) {
    return <p role="alert">Could not load challenges.</p>;
  }

  const { challenges } = active.data;
  if (challenges.length === 0) {
    return <EmptyState icon={faFlagCheckered} message="No active challenges this period." />;
  }

  return (
    <ul className="grid gap-space-md sm:grid-cols-2">
      {challenges.map((challenge) => (
        <li key={challenge.id}>
          <ChallengeCard
            challenge={challenge}
            progress={mine.data.progress.find((p) => p.challengeId === challenge.id)}
          />
        </li>
      ))}
    </ul>
  );
}

export default function ChallengesPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Challenges</h1>
      <StudentScope>{(studentId) => <ChallengesContent studentId={studentId} />}</StudentScope>
    </div>
  );
}
