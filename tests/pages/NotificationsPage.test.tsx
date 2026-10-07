import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NotificationsPage from '@/pages/NotificationsPage';

const { mutate, useMyNotificationsMock } = vi.hoisted(() => ({
  mutate: vi.fn(),
  useMyNotificationsMock: vi.fn(),
}));

vi.mock('@/hooks/useNotifications', () => ({
  useMyNotifications: (...args: unknown[]) => useMyNotificationsMock(...args),
  useMarkRead: () => ({ mutate }),
}));

function makeNotification(id: string, readAt: string | null = null) {
  return {
    id,
    type: 'NEW_MESSAGE',
    payload: {},
    channel: 'PUSH',
    status: 'SENT',
    sentAt: null,
    readAt,
    createdAt: '2026-10-06T10:00:00.000Z',
  };
}

function mockResult(
  notifications: ReturnType<typeof makeNotification>[],
  total = notifications.length
) {
  useMyNotificationsMock.mockReturnValue({
    data: { notifications, page: 1, limit: 20, total },
    isLoading: false,
    isError: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NotificationsPage', () => {
  it('renders EmptyState, not an error, for an empty list', () => {
    mockResult([]);
    render(<NotificationsPage />);
    expect(screen.getByRole('status')).toHaveTextContent('You have no notifications.');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('marks read when an unread row is opened (side effect)', () => {
    mockResult([makeNotification('n1')]);
    render(<NotificationsPage />);
    fireEvent.click(screen.getByTestId('row-n1'));
    expect(mutate).toHaveBeenCalledWith('n1');
  });

  it('marks read with the explicit button', () => {
    mockResult([makeNotification('n1')]);
    render(<NotificationsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark read' }));
    expect(mutate).toHaveBeenCalledWith('n1');
  });

  it('does not offer mark read for already-read rows', () => {
    mockResult([makeNotification('n1', '2026-10-06T11:00:00.000Z')]);
    render(<NotificationsPage />);
    expect(screen.queryByRole('button', { name: 'Mark read' })).toBeNull();
  });

  it('flips the unread filter and resets to page 1', () => {
    mockResult([makeNotification('n1')]);
    render(<NotificationsPage />);
    expect(useMyNotificationsMock).toHaveBeenLastCalledWith(false, 1);
    fireEvent.click(screen.getByLabelText('Unread only'));
    expect(useMyNotificationsMock).toHaveBeenLastCalledWith(true, 1);
  });

  it('paginates with Next and Previous', () => {
    mockResult([makeNotification('n1')], 45);
    render(<NotificationsPage />);
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(useMyNotificationsMock).toHaveBeenLastCalledWith(false, 2);
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(useMyNotificationsMock).toHaveBeenLastCalledWith(false, 1);
  });
});
