import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PayoutBatchTable from '@/components/admin-payments/PayoutBatchTable';
import { formatMoney } from '@/lib/money';
import type { PayoutBatch } from '@/types';

const pending: PayoutBatch = {
  id: 'p1',
  tutorId: 'tutor-1',
  periodStart: '2026-09-01T00:00:00Z',
  periodEnd: '2026-09-30T23:59:59Z',
  totalAmount: '3600.00',
  status: 'PENDING',
};
const paid: PayoutBatch = { ...pending, id: 'p2', tutorId: 'tutor-2', status: 'PAID' };

describe('PayoutBatchTable', () => {
  const onMarkPaid = vi.fn();
  beforeEach(() => vi.clearAllMocks());

  it('renders the amount through formatMoney', () => {
    render(<PayoutBatchTable payouts={[pending]} onMarkPaid={onMarkPaid} pendingId={null} />);
    expect(screen.getByText(formatMoney('3600.00'))).toBeInTheDocument();
  });

  it('calls onMarkPaid with the payout id', () => {
    render(<PayoutBatchTable payouts={[pending]} onMarkPaid={onMarkPaid} pendingId={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark payout p1 as paid' }));
    expect(onMarkPaid).toHaveBeenCalledWith('p1');
  });

  it('disables "Mark paid" once the payout is PAID', () => {
    render(<PayoutBatchTable payouts={[paid]} onMarkPaid={onMarkPaid} pendingId={null} />);
    const button = screen.getByRole('button', { name: 'Mark payout p2 as paid' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onMarkPaid).not.toHaveBeenCalled();
  });

  it('disables only the row whose request is pending', () => {
    render(
      <PayoutBatchTable
        payouts={[pending, { ...pending, id: 'p3' }]}
        onMarkPaid={onMarkPaid}
        pendingId="p1"
      />
    );
    expect(screen.getByRole('button', { name: 'Mark payout p1 as paid' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mark payout p3 as paid' })).toBeEnabled();
  });

  it('shows the empty state when there are no batches', () => {
    render(<PayoutBatchTable payouts={[]} onMarkPaid={onMarkPaid} pendingId={null} />);
    expect(screen.getByText('No payout batches yet.')).toBeInTheDocument();
  });
});
