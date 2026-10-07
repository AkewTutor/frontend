import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MessageThreadView from '@/components/messaging/MessageThreadView';
import { useAuthStore } from '@/store/auth.store';
import type { Message, MessageThread } from '@/types';

const { useThreadMock, useMessagesMock } = vi.hoisted(() => ({
  useThreadMock: vi.fn(),
  useMessagesMock: vi.fn(),
}));

vi.mock('@/hooks/useMessaging', () => ({
  useThread: (id: string) => useThreadMock(id),
  useMessages: (id: string, page: number) => useMessagesMock(id, page),
  useSendMessage: () => ({ mutate: vi.fn(), isPending: false }),
}));

const thread = (over: Partial<MessageThread> = {}): MessageThread => ({
  id: 'th1',
  cohortId: 'c1',
  format: 'ONE_TO_ONE',
  status: 'ACTIVE',
  participantCount: 2,
  ...over,
});

const message = (over: Partial<Message> = {}): Message => ({
  id: 'm1',
  senderId: 'other',
  senderRole: 'TUTOR',
  body: 'Running 5 minutes late',
  createdAt: '2026-09-08T15:56:00Z',
  ...over,
});

function mockThread(data: MessageThread) {
  useThreadMock.mockReturnValue({ data, isLoading: false, isError: false, error: null });
}

function mockMessages(messages: Message[], total = messages.length, limit = 50) {
  useMessagesMock.mockReturnValue({
    data: { messages, page: 1, limit, total },
    isLoading: false,
    isError: false,
    error: null,
  });
}

const forbidden = {
  data: undefined,
  isLoading: false,
  isError: true,
  error: { response: { status: 403 } },
};

function renderView() {
  return render(
    <MemoryRouter initialEntries={['/messaging']}>
      <Routes>
        <Route path="/messaging" element={<MessageThreadView cohortId="c1" />} />
        <Route path="/student" element={<p>student home</p>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    user: { id: 'me', role: 'STUDENT', email: null, phone: null },
  });
});

describe('MessageThreadView', () => {
  it('hides sender identity in a pair thread', () => {
    mockThread(thread({ format: 'ONE_TO_ONE', participantCount: 2 }));
    mockMessages([message()]);
    renderView();
    expect(screen.getByText('Running 5 minutes late')).toBeInTheDocument();
    expect(screen.queryByText('Tutor')).toBeNull();
  });

  it('shows sender role in a group thread, and "You" for own messages', () => {
    mockThread(thread({ format: 'ONE_TO_THREE', participantCount: 4 }));
    mockMessages([
      message(),
      message({ id: 'm2', senderId: 'me', senderRole: 'STUDENT', body: 'ok' }),
    ]);
    renderView();
    expect(screen.getByText('Tutor')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('replaces the view with EmptyState when useThread returns 403', () => {
    useThreadMock.mockReturnValue(forbidden);
    mockMessages([]);
    renderView();
    expect(screen.getByRole('status')).toHaveTextContent(/not available/i);
    expect(screen.queryByRole('log')).toBeNull();
  });

  it('replaces the view with EmptyState when useMessages returns 403', () => {
    mockThread(thread());
    useMessagesMock.mockReturnValue(forbidden);
    renderView();
    expect(screen.getByRole('status')).toHaveTextContent(/not available/i);
    expect(screen.queryByRole('log')).toBeNull();
  });

  it('goes back to the role home from the 403 EmptyState', () => {
    useThreadMock.mockReturnValue(forbidden);
    mockMessages([]);
    renderView();
    fireEvent.click(screen.getByRole('button', { name: 'Back to dashboard' }));
    expect(screen.getByText('student home')).toBeInTheDocument();
  });

  it('renders the full history of an archived thread, read-only', () => {
    mockThread(thread({ status: 'ARCHIVED' }));
    mockMessages([message()]);
    renderView();
    expect(screen.getByText('Running 5 minutes late')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeDisabled();
  });

  it('passes the thread status to the composer', () => {
    mockThread(thread({ status: 'CLOSED_BY_ADMIN' }));
    mockMessages([message()]);
    renderView();
    expect(screen.getByText('This conversation has been closed.')).toBeInTheDocument();
  });

  it('shows pagination only when there is more than one page', () => {
    mockThread(thread());
    mockMessages([message()], 120, 50);
    const { unmount } = renderView();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(useMessagesMock).toHaveBeenLastCalledWith('c1', 2);
    unmount();

    mockMessages([message()], 1, 50);
    renderView();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
  });

  it('shows loading and generic error states', () => {
    useThreadMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    useMessagesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { unmount } = renderView();
    expect(screen.getByText(/loading messages/i)).toBeInTheDocument();
    unmount();

    const failed = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { status: 500 } },
    };
    useThreadMock.mockReturnValue(failed);
    useMessagesMock.mockReturnValue(failed);
    renderView();
    expect(screen.getByText(/couldn.t load this conversation/i)).toBeInTheDocument();
  });
});
