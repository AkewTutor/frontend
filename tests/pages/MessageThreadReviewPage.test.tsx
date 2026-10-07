import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MessageThreadReviewPage from '@/pages/admin/MessageThreadReviewPage';
import type { AdminThreadView } from '@/types';

const { useReviewThreadMock, closeMutate } = vi.hoisted(() => ({
  useReviewThreadMock: vi.fn(),
  closeMutate: vi.fn(),
}));

vi.mock('@/hooks/useAdminMessaging', () => ({
  useReviewThread: (id: string, page: number) => useReviewThreadMock(id, page),
  useCloseThread: () => ({ mutate: closeMutate, isPending: false }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const thread = (over: Partial<AdminThreadView> = {}): AdminThreadView => ({
  id: 'th1',
  cohortId: 'c1',
  status: 'ACTIVE',
  messages: [
    { id: 'm1', senderId: 'abcdef123456', body: 'Please stop', createdAt: '2026-09-08T15:56:00Z' },
  ],
  page: 1,
  limit: 50,
  total: 1,
  ...over,
});

function mockThread(data: AdminThreadView) {
  useReviewThreadMock.mockReturnValue({ data, isLoading: false, isError: false, error: null });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/messaging/th1']}>
      <Routes>
        <Route path="/admin/messaging/:threadId" element={<MessageThreadReviewPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MessageThreadReviewPage', () => {
  it('renders the history read-only with no composer anywhere', () => {
    mockThread(thread());
    renderPage();
    expect(useReviewThreadMock).toHaveBeenCalledWith('th1', 1);
    expect(screen.getByText('Please stop')).toBeInTheDocument();
    expect(screen.queryByLabelText('Message')).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  });

  it('does not call close until a non-empty reason is entered', () => {
    mockThread(thread());
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Close conversation' }));
    const confirm = screen.getByRole('button', { name: 'Confirm close' });
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(closeMutate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Reason for closing'), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'Confirm close' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Reason for closing'), {
      target: { value: 'Harassment' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm close' }));
    expect(closeMutate).toHaveBeenCalledWith(
      { threadId: 'th1', reason: 'Harassment' },
      expect.any(Object)
    );
  });

  it('hides the close action once the thread is closed', () => {
    mockThread(thread({ status: 'CLOSED_BY_ADMIN' }));
    renderPage();
    expect(screen.queryByRole('button', { name: 'Close conversation' })).toBeNull();
  });

  it('shows a distinct not-found state on 404', () => {
    useReviewThreadMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { status: 404 } },
    });
    renderPage();
    expect(screen.getByText('Conversation not found.')).toBeInTheDocument();
  });

  it('shows a generic error and a loading state', () => {
    useReviewThreadMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { status: 500 } },
    });
    const { unmount } = renderPage();
    expect(screen.getByText(/couldn.t load this conversation/i)).toBeInTheDocument();
    unmount();

    useReviewThreadMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    renderPage();
    expect(screen.getByText(/loading conversation/i)).toBeInTheDocument();
  });

  it('paginates only when there is more than one page', () => {
    mockThread(thread({ total: 120, limit: 50 }));
    const { unmount } = renderPage();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(useReviewThreadMock).toHaveBeenLastCalledWith('th1', 2);
    unmount();

    mockThread(thread({ total: 1 }));
    renderPage();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
  });
});
