import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import PaymentReminderBanner from '@/components/payments/PaymentReminderBanner';

const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();
const view = (due: string) =>
  render(
    <MemoryRouter>
      <PaymentReminderBanner studentId="s1" dueDate={due} />
    </MemoryRouter>
  );

describe('PaymentReminderBanner', () => {
  it('shows a countdown inside the 3-day window', () => {
    view(inDays(2));
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('renders nothing when the due date is further than 3 days away', () => {
    view(inDays(10));
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });
});
