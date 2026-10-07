import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const ESCALATION_SECONDS = 48 * 60 * 60;

interface NoExactMatchButtonProps {
  zeroMatchSince: string | null;
  onTrigger: () => void;
}

function formatRemaining(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// Countdown is client-computed from the timestamp (not authoritative; the server escalates).
export default function NoExactMatchButton({ zeroMatchSince, onTrigger }: NoExactMatchButtonProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!zeroMatchSince) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [zeroMatchSince]);

  if (!zeroMatchSince) {
    return <Button onClick={onTrigger}>No exact match? Widen my search</Button>;
  }

  const elapsed = Math.max(0, Math.floor((now - new Date(zeroMatchSince).getTime()) / 1000));
  const remaining = Math.max(0, ESCALATION_SECONDS - elapsed);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={onTrigger}>
        {remaining === 0 ? 'Escalating automatically' : 'No exact match? Widen my search'}
      </Button>
      <p className="text-sm text-muted-foreground">
        {`Time until automatic escalation: ${formatRemaining(remaining)}`}
      </p>
    </div>
  );
}
