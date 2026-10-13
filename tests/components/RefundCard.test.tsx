import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RefundCard from '@/components/admin-payments/RefundCard';
import { formatMoney } from '@/lib/money';
import type { RefundCase } from '@/types';

const pending: RefundCase = {
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

describe('RefundCard', () => {
  const onApprove = vi.fn();
  const onReject = vi.fn();
  beforeEach(() => vi.clearAllMocks());

  const renderCard = (refund: RefundCase = pending) =>
    render(<RefundCard refund={refund} onApprove={onApprove} onReject={onReject} />);

  it('renders the amount via formatMoney and the breakdown verbatim', () => {
    renderCard();
    expect(screen.getByText(formatMoney('87.50'))).toBeInTheDocument();
    expect(screen.getByText('Sessions remaining: 2 of 8')).toBeInTheDocument();
  });

  it('approves via onApprove', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Approve refund r1' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('requires a reason before rejecting', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Reject refund r1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reject' }));
    expect(onReject).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('A rejection reason is required.');
  });

  it('treats a whitespace-only reason as empty', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Reject refund r1' }));
    fireEvent.change(screen.getByLabelText('Rejection reason'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reject' }));
    expect(onReject).not.toHaveBeenCalled();
  });

  it('passes the trimmed reason to onReject', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Reject refund r1' }));
    fireEvent.change(screen.getByLabelText('Rejection reason'), {
      target: { value: '  Duplicate case ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reject' }));
    expect(onReject).toHaveBeenCalledWith('Duplicate case');
  });

  it('hides actions and shows the audit trail once APPROVED', () => {
    renderCard({
      ...pending,
      status: 'APPROVED',
      approvedById: 'admin-1',
      approvedAt: '2026-09-06T15:00:00Z',
    });
    expect(screen.queryByRole('button', { name: /Approve refund/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reject refund/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Approved by admin-1/)).toBeInTheDocument();
  });

  it('hides actions and shows the rejection reason once REJECTED', () => {
    renderCard({
      ...pending,
      status: 'REJECTED',
      rejectedById: 'admin-2',
      rejectedAt: '2026-09-06T15:00:00Z',
      rejectionReason: 'Student-initiated',
    });
    expect(screen.queryByRole('button', { name: /Approve refund/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reject refund/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Rejected by admin-2/)).toBeInTheDocument();
    expect(screen.getByText('Reason: Student-initiated')).toBeInTheDocument();
  });
});
