import type { CSSProperties } from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/* Light theme only (spec §0.0). Toaster is mounted once, later, in App.tsx. */
const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    style={
      {
        '--normal-bg': 'var(--color-popover)',
        '--normal-text': 'var(--color-popover-foreground)',
        '--normal-border': 'var(--color-border)',
        '--border-radius': 'var(--radius-s)',
      } as CSSProperties
    }
    {...props}
  />
);

export { Toaster };
