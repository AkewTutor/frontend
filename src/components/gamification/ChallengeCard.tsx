import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Challenge, ChallengeProgress } from '@/types';

export default function ChallengeCard({
  challenge,
  progress,
}: {
  challenge: Challenge;
  progress: ChallengeProgress | undefined;
}) {
  const completed = Boolean(progress?.completedAt);
  // A completed challenge is frozen at its target; later server-side bumps never overshoot the bar.
  const value = completed
    ? challenge.targetValue
    : Math.min(progress?.progressValue ?? 0, challenge.targetValue);
  const percent = Math.round((value / challenge.targetValue) * 100);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{challenge.title}</p>
            <p className="text-s text-muted-foreground">
              {challenge.period === 'WEEKLY' ? 'Weekly' : 'Monthly'} · ends{' '}
              {new Date(challenge.endsAt).toLocaleDateString()}
            </p>
          </div>
          {completed && <Badge>Completed</Badge>}
        </div>
        <div
          role="progressbar"
          aria-label={`${challenge.title} progress`}
          aria-valuemin={0}
          aria-valuemax={challenge.targetValue}
          aria-valuenow={value}
          className="h-3 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-s text-muted-foreground">
          {value} / {challenge.targetValue}
        </p>
      </CardContent>
    </Card>
  );
}
