import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import EarningsPage from '@/pages/tutor/EarningsPage';
import { formatMoney } from '@/lib/money';
import type { TutorEarningsResponse } from '@/types';

const mocks = vi.hoisted(() => ({ earnings: vi.fn() }));

vi.mock('@/hooks/useEarnings', () => ({
  useMyEarnings: (page: number) => mocks.earnings(page),
}));

const response: TutorEarningsResponse = {
  earnings: [
    { sessionId: 's1', amount: '250.00', rateType: 'FULL', createdAt: '2026-09-05T17:00:00Z' },
    {
      sessionId: 's2',
      amount: '125.00',
      rateType: 'REDUCED_MAKEUP',
      createdAt: '2026-09-06T17:00:00Z',
    },
  ],
  upcomingPayout: {
    periodStart: '2026-09-01T00:00:00Z',
    periodEnd: '2026-09-30T23:59:59Z',
    estimatedTotal: '3750.00',
    expectedDate: '2026-10-01T00:00:00Z',
  },
  page: 1,
  limit: 20,
  total: 2,
};

function setup(data: TutorEarningsResponse = response) {
  mocks.earnings.mockReturnValue({ data, isLoading: false, isError: false });
  render(<EarningsPage />);
}

describe('EarningsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests page 1 and shows the upcoming payout via formatMoney', () => {
    setup();
    expect(mocks.earnings).toHaveBeenLastCalledWith(1);
    expect(screen.getByText(formatMoney('3750.00'))).toBeInTheDocument();
  });

  it('itemizes sessions inline with their amount and rate label', () => {
    setup();
    expect(screen.getByText(formatMoney('250.00'))).toBeInTheDocument();
    expect(screen.getByText(formatMoney('125.00'))).toBeInTheDocument();
    expect(screen.getByText('Full rate')).toBeInTheDocument();
    expect(screen.getByText('Reduced rate (make-up)')).toBeInTheDocument();
  });

  it('shows an empty state but keeps the payout card when there are no earnings', () => {
    setup({ ...response, earnings: [], total: 0 });
    expect(screen.getByText('No earnings yet.')).toBeInTheDocument();
    expect(screen.getByText(formatMoney('3750.00'))).toBeInTheDocument();
  });

  it('shows an error when earnings cannot load', () => {
    mocks.earnings.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<EarningsPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load earnings.');
  });
});
