import BadgeGrid from '@/components/gamification/BadgeGrid';
import StreakFlame from '@/components/gamification/StreakFlame';
import StudentScope from '@/components/gamification/StudentScope';
import XPProgressBar from '@/components/gamification/XPProgressBar';
import { useMyBadges, useMyProgress } from '@/hooks/useGamification';

function AchievementsContent({ studentId }: { studentId: string | undefined }) {
  const progress = useMyProgress(studentId);
  const badges = useMyBadges(studentId);

  if (progress.isLoading || badges.isLoading) return <p role="status">Loading…</p>;
  if (progress.isError || badges.isError || !progress.data || !badges.data) {
    return <p role="alert">Could not load achievements.</p>;
  }

  return (
    <div className="flex flex-col gap-space-lg">
      <XPProgressBar totalXP={progress.data.totalXP} />
      <StreakFlame streak={progress.data.streak} totalXP={progress.data.totalXP} />
      <section className="flex flex-col gap-space-md">
        <h2 className="text-m font-semibold">Badges</h2>
        <BadgeGrid badges={badges.data.badges} />
      </section>
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Achievements</h1>
      <StudentScope>{(studentId) => <AchievementsContent studentId={studentId} />}</StudentScope>
    </div>
  );
}
