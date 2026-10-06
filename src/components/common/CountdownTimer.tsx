import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  targetIso: string;
  /** Called exactly once when the countdown reaches zero (or if the target is already past). */
  onExpire?: () => void;
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

export default function CountdownTimer({ targetIso, onExpire, className }: CountdownTimerProps) {
  const target = new Date(targetIso).getTime();
  const valid = Number.isFinite(target);
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  const remaining = valid ? target - now : NaN;
  const expired = valid && remaining <= 0;

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!valid || expired) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [valid, expired]);

  useEffect(() => {
    if (!expired) {
      firedRef.current = false;
      return;
    }
    if (!firedRef.current) {
      firedRef.current = true;
      onExpireRef.current?.();
    }
  }, [expired]);

  const danger = valid && remaining <= 60_000;

  return (
    <time
      role="timer"
      dateTime={valid ? targetIso : undefined}
      className={cn(
        'text-m font-semibold tabular-nums',
        danger ? 'text-danger' : 'text-ink',
        className
      )}
    >
      {valid ? formatRemaining(remaining) : '--:--:--'}
    </time>
  );
}
