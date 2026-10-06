import * as React from 'react';
import { Label as LabelPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

/* Spec §0.1: text-s, weight 500, ink; `required` adds a danger asterisk. */
function Label({
  className,
  required = false,
  children,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & { required?: boolean }) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex items-center gap-1 text-s leading-none font-medium text-ink select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-danger">
          *
        </span>
      )}
    </LabelPrimitive.Root>
  );
}

export { Label };
