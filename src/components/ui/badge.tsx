import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* Spec §0.1: generic pill. Variants: default | success | warning | danger. */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-pill px-3 py-1 text-s leading-none font-medium whitespace-nowrap [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        success: 'bg-accent/40 text-success',
        warning: 'bg-warning text-dark',
        danger: 'bg-danger/10 text-danger',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
