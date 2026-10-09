// Cosmetic level only: no server-side level field exists (8-6). 100 XP per level is a presentation choice.
const XP_PER_LEVEL = 100;

export default function XPProgressBar({ totalXP }: { totalXP: number }) {
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const intoLevel = totalXP % XP_PER_LEVEL;

  return (
    <section aria-label="Experience points" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="text-l font-bold text-primary">Level {level}</p>
        <p className="text-s text-muted-foreground">{totalXP} XP total</p>
      </div>
      <div
        role="progressbar"
        aria-label="Progress to next level"
        aria-valuemin={0}
        aria-valuemax={XP_PER_LEVEL}
        aria-valuenow={intoLevel}
        className="h-3 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full bg-primary" style={{ width: `${intoLevel}%` }} />
      </div>
      <p className="text-s text-muted-foreground">
        {intoLevel} / {XP_PER_LEVEL} XP to level {level + 1}
      </p>
    </section>
  );
}
