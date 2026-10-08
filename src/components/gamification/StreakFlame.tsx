import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire } from '@fortawesome/free-solid-svg-icons';

import type { XPProgress } from '@/types';

// totalXP is its own prop and is never derived from the streak: the two are independent server-side.
export default function StreakFlame({
  streak,
  totalXP,
}: {
  streak: XPProgress['streak'];
  totalXP: number;
}) {
  const { currentStreakDays, longestStreakDays } = streak;

  return (
    <section aria-label="Streak" className="flex flex-wrap items-center gap-space-md">
      <div className="flex items-center gap-3">
        <FontAwesomeIcon
          icon={faFire}
          aria-hidden="true"
          className={
            currentStreakDays > 0 ? 'text-3xl text-accent' : 'text-3xl text-muted-foreground'
          }
        />
        <div>
          <p className="text-l font-bold">{currentStreakDays}</p>
          <p className="text-s text-muted-foreground">Current streak (days)</p>
        </div>
      </div>
      <div>
        <p className="text-m font-semibold">{longestStreakDays}</p>
        <p className="text-s text-muted-foreground">Longest streak (days)</p>
      </div>
      <div>
        <p className="text-m font-semibold">{totalXP}</p>
        <p className="text-s text-muted-foreground">Total XP</p>
      </div>
      {currentStreakDays === 0 && (
        <p className="w-full text-s text-muted-foreground">Attend a class to start a streak.</p>
      )}
    </section>
  );
}
