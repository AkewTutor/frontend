import * as React from 'react';

import { cn } from '@/lib/utils';

/* Spec §0.1: 48px, radius-s, 1px ink/20 border, primary focus ring, error + disabled states. */
type InputProps = React.ComponentProps<'input'> & { error?: boolean };

function Input({ className, type, error = false, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      aria-invalid={error || undefined}
      className={cn(
        'h-12 w-full min-w-0 rounded-s border border-ink/20 bg-white px-4 text-m text-ink transition-colors outline-none placeholder:text-muted-foreground',
        'focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary',
        'disabled:cursor-not-allowed disabled:bg-ink/5',
        error && 'border-danger focus-visible:border-danger focus-visible:ring-danger',
        className
      )}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
