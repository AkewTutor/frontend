import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PayoutManagementPage from '@/pages/admin/PayoutManagementPage';
import type { PayoutBatch } from '@/types';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  markPaid: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/usePayouts', () => ({
  usePayoutBatches: (page: number) => mocks.list(page),
  useMarkPaid: () => mocks.markPaid,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const payout: PayoutBatch = {
  id: 'p1',
  tutorId: 'tutor-1',
  periodStart: '2026-09-01T00:00:00Z',
  periodEnd: '2026-09-30T23:59:59Z',
  totalAmount: '3600.00',
  status: 'PENDING',
};

function setup(payouts: PayoutBatch[]) {
  mocks.list.mockReturnValue({
    data: { payouts, page: 1, limit: 20, total: payouts.length },
    isLoading: false,
    isError: false,
  });
  render(<PayoutManagementPage />);
}

describe('PayoutManagementPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the empty state when there are no batches', () => {
    setup([]);
    expect(screen.getByText('No payout batches yet.')).toBeInTheDocument();
  });

  it('lists batches on page 1 and marks one as paid', () => {
    setup([payout]);
    expect(mocks.list).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Mark payout p1 as paid' }));
    expect(mocks.markPaid.mutate).toHaveBeenCalledWith('p1', expect.any(Object));
  });

  it('shows an error when the list cannot load', () => {
    mocks.list.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<PayoutManagementPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load payouts.');
  });
});
