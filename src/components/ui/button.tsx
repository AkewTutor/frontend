import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

import { cn } from '@/lib/utils';

/*
 * Spec: 10-ui-foundation-spec.md §0.1. Feature code uses ONLY:
 *   variant: primary | secondary | destructive | ghost
 *   size:    sm | md | lg
 * Aliases (default, outline, link, xs, default size, icon*) exist only so shadcn-generated
 * components (dialog, alert-dialog, ...) compile. Do not use them in feature code.
 *
 * Dark surfaces: wrap in an element with data-surface="dark" (header, hero, sidebar)
 * to get the hero-style hover/secondary treatment.
 */
const primary =
  'border-accent bg-accent text-dark hover:brightness-95 in-data-[surface=dark]:hover:bg-white in-data-[surface=dark]:hover:brightness-100';
const secondary =
  'border-primary bg-transparent text-primary hover:bg-primary hover:text-white in-data-[surface=dark]:border-white/60 in-data-[surface=dark]:text-white in-data-[surface=dark]:hover:bg-white in-data-[surface=dark]:hover:text-primary';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-pill border-2 border-transparent font-medium whitespace-nowrap transition-all duration-250 select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary,
        secondary,
        destructive: 'border-danger bg-danger text-white hover:border-danger/90 hover:bg-danger/90',
        ghost: 'text-ink hover:bg-ink/5',
        // aliases for shadcn-generated components
        default: primary,
        outline: secondary,
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'px-5 py-2 text-s',
        md: 'px-[34px] py-4 text-m',
        lg: 'px-10 py-[18px] text-m',
        // aliases for shadcn-generated components
        default: 'px-[34px] py-4 text-m',
        xs: 'px-3 py-1 text-s',
        icon: 'size-10 p-0',
        'icon-xs': 'size-6 p-0',
        'icon-sm': 'size-8 p-0',
        'icon-lg': 'size-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Inline spinner, label stays. Also disables the button. Ignored with asChild. */
    loading?: boolean;
  };

function Button({
  className,
  variant = 'primary',
  size = 'md',
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={loading || undefined}
      disabled={asChild ? undefined : disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <FontAwesomeIcon icon={faSpinner} spin aria-hidden="true" />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
