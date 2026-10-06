import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faMinus } from '@fortawesome/free-solid-svg-icons';

import { cn } from '@/lib/utils';

/* Spec §0.1: 6px radius, checked bg primary, white tick. `indeterminate` overrides `checked`. */
type CheckboxProps = Omit<React.ComponentProps<typeof CheckboxPrimitive.Root>, 'checked'> & {
  checked?: boolean;
  indeterminate?: boolean;
};

function Checkbox({ className, checked, indeterminate = false, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={indeterminate ? 'indeterminate' : checked}
      className={cn(
        'peer size-5 shrink-0 rounded-[6px] border border-ink/40 bg-white text-white transition-colors outline-none',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
        'focus-visible:ring-3 focus-visible:ring-primary/40',
        'aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <FontAwesomeIcon icon={indeterminate ? faMinus : faCheck} className="text-[0.7rem]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
