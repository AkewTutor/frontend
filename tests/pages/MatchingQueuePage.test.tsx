import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ApprovalQueueTable from '@/components/admin-matching/ApprovalQueueTable';
import type { MatchingQueueItem } from '@/types';

function item(overrides: Partial<MatchingQueueItem> = {}): MatchingQueueItem {
  return {
    cohortId: 'c1',
    path: 'PATH_A',
    format: 'ONE_TO_ONE',
    tutorId: 't1',
    studentIds: ['s1'],
    createdAt: '2026-10-01T10:00:00Z',
    isOverdue: false,
    adminOverdueNotifiedAt: null,
    studentDelayNotifiedAt: null,
    ...overrides,
  };
}

describe('ApprovalQueueTable', () => {
  it('marks only rows with adminOverdueNotifiedAt as overdue', () => {
    render(
      <ApprovalQueueTable
        items={[
          item({ cohortId: 'late', adminOverdueNotifiedAt: '2026-10-03T10:00:00Z' }),
          item({ cohortId: 'fresh' }),
        ]}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveAttribute('data-overdue', 'true');
    expect(within(rows[1]).getByText('Overdue')).toBeInTheDocument();
    expect(rows[2]).toHaveAttribute('data-overdue', 'false');
    expect(within(rows[2]).queryByText('Overdue')).toBeNull();
  });

  it('ignores isOverdue alone: the notified timestamp is the only source', () => {
    render(
      <ApprovalQueueTable
        items={[item({ isOverdue: true, adminOverdueNotifiedAt: null })]}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('data-overdue', 'false');
  });

  it('does not call onReject until a non-empty reason is entered', () => {
    const onReject = vi.fn();
    render(<ApprovalQueueTable items={[item()]} onApprove={vi.fn()} onReject={onReject} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    const confirm = screen.getByRole('button', { name: 'Confirm reject' });
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(onReject).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Rejection reason'), { target: { value: '   ' } });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Rejection reason'), {
      target: { value: 'Tutor unavailable' },
    });
    fireEvent.click(confirm);
    expect(onReject).toHaveBeenCalledWith('c1', 'Tutor unavailable');
  });

  it('calls onApprove with the cohort id', () => {
    const onApprove = vi.fn();
    render(<ApprovalQueueTable items={[item()]} onApprove={onApprove} onReject={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledWith('c1');
  });

  it('renders the clear-queue EmptyState for an empty list', () => {
    render(<ApprovalQueueTable items={[]} onApprove={vi.fn()} onReject={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('The approval queue is clear.');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
