import { fireEvent, render, screen, within } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ApprovalQueueTable from '@/components/admin-matching/ApprovalQueueTable';
import MatchingQueuePage from '@/pages/admin/MatchingQueuePage';
import type { MatchingQueueItem } from '@/types';

const { useApprovalQueueMock, approveMutate, rejectMutate } = vi.hoisted(() => ({
  useApprovalQueueMock: vi.fn(),
  approveMutate: vi.fn(),
  rejectMutate: vi.fn(),
}));

vi.mock('@/hooks/useAdminMatching', () => ({
  useApprovalQueue: (page: number) => useApprovalQueueMock(page),
  useApproveCohort: () => ({ mutate: approveMutate }),
  useRejectCohort: () => ({ mutate: rejectMutate }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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

  function mockQueue(queue: MatchingQueueItem[], total = queue.length, limit = 20) {
    useApprovalQueueMock.mockReturnValue({
      data: { queue, page: 1, limit, total },
      isLoading: false,
      isError: false,
    });
  }

  describe('MatchingQueuePage', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('maps data.queue into table rows', () => {
      mockQueue([item({ cohortId: 'a' }), item({ cohortId: 'b' })]);
      render(<MatchingQueuePage />);
      expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2
    });

    it('shows the clear-queue EmptyState and no refresh control', () => {
      mockQueue([]);
      render(<MatchingQueuePage />);
      expect(screen.getByRole('status')).toHaveTextContent('The approval queue is clear.');
      expect(screen.queryByRole('button', { name: /refresh|check now/i })).toBeNull();
    });

    it('shows loading and error states', () => {
      useApprovalQueueMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
      const { unmount } = render(<MatchingQueuePage />);
      expect(screen.getByText(/loading approval queue/i)).toBeInTheDocument();
      unmount();

      useApprovalQueueMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
      render(<MatchingQueuePage />);
      expect(screen.getByText(/couldn.t load the approval queue/i)).toBeInTheDocument();
    });

    it('approves a cohort and toasts on success', () => {
      mockQueue([item({ cohortId: 'c1' })]);
      approveMutate.mockImplementation((_id, opts) => opts.onSuccess());
      render(<MatchingQueuePage />);
      fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
      expect(approveMutate).toHaveBeenCalledWith('c1', expect.any(Object));
      expect(toast.success).toHaveBeenCalled();
    });

    it('rejects with the entered reason and toasts on failure', () => {
      mockQueue([item({ cohortId: 'c1' })]);
      rejectMutate.mockImplementation((_body, opts) => opts.onError());
      render(<MatchingQueuePage />);
      fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
      fireEvent.change(screen.getByLabelText('Rejection reason'), {
        target: { value: 'Tutor unavailable' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Confirm reject' }));
      expect(rejectMutate).toHaveBeenCalledWith(
        { cohortId: 'c1', reason: 'Tutor unavailable' },
        expect.any(Object)
      );
      expect(toast.error).toHaveBeenCalled();
    });

    it('paginates only when there is more than one page', () => {
      mockQueue([item()], 45, 20);
      render(<MatchingQueuePage />);
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(useApprovalQueueMock).toHaveBeenLastCalledWith(2);
    });

    it('hides pagination for a single page', () => {
      mockQueue([item()], 1, 20);
      render(<MatchingQueuePage />);
      expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    });
  });
});
