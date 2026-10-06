import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  message: string;
  icon?: IconDefinition;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export default function EmptyState({
  message,
  icon = faInbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-space-md px-space-gutter py-space-lg text-center',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="flex size-[84px] items-center justify-center rounded-full bg-accent text-dark"
      >
        <FontAwesomeIcon icon={icon} className="text-3xl" />
      </div>
      <p className="max-w-md text-m text-muted-foreground">{message}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
