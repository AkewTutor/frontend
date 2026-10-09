import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RefundReviewPage from '@/pages/admin/RefundReviewPage';
import type { RefundCase } from '@/types';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  approve: { mutate: vi.fn(), isPending: false },
  reject: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/useRefunds', () => ({
  useRefundQueue: (page: number, status: string) => mocks.list(page, status),
  useApproveRefund: () => mocks.approve,
  useRejectRefund: () => mocks.reject,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const refund: RefundCase = {
  id: 'r1',
  paymentId: 'pay-1',
  amount: '87.50',
  reason: 'TUTOR_DROPOUT',
  status: 'PENDING',
  sessionsRemaining: 2,
  totalSessionsBilled: 8,
  approvedById: null,
  approvedAt: null,
  rejectedById: null,
  rejectedAt: null,
  rejectionReason: null,
  createdAt: '2026-09-01T10:00:00Z',
};

function setup(refunds: RefundCase[]) {
  mocks.list.mockReturnValue({
    data: { refunds, page: 1, limit: 20, total: refunds.length },
    isLoading: false,
    isError: false,
  });
  render(<RefundReviewPage />);
}

describe('RefundReviewPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the queue-clear state for an empty pending queue', () => {
    setup([]);
    expect(screen.getByText('The refund queue is clear.')).toBeInTheDocument();
    expect(mocks.list).toHaveBeenLastCalledWith(1, 'PENDING');
  });

  it('approves a refund by id', () => {
    setup([refund]);
    fireEvent.click(screen.getByRole('button', { name: 'Approve refund r1' }));
    expect(mocks.approve.mutate).toHaveBeenCalledWith('r1', expect.any(Object));
  });

  it('rejects with the entered reason', () => {
    setup([refund]);
    fireEvent.click(screen.getByRole('button', { name: 'Reject refund r1' }));
    fireEvent.change(screen.getByLabelText('Rejection reason'), { target: { value: 'Duplicate' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reject' }));
    expect(mocks.reject.mutate).toHaveBeenCalledWith(
      { refundId: 'r1', rejectionReason: 'Duplicate' },
      expect.any(Object)
    );
  });

  it('changing the status filter re-queries from page 1', () => {
    setup([refund]);
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'APPROVED' } });
    expect(mocks.list).toHaveBeenLastCalledWith(1, 'APPROVED');
  });

  it('shows an error when the queue cannot load', () => {
    mocks.list.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<RefundReviewPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load refunds.');
  });
});
