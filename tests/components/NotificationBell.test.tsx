import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NotificationBell from '@/components/common/NotificationBell';

const { navigate, mutate, useMyNotificationsMock } = vi.hoisted(() => ({
  navigate: vi.fn(),
  mutate: vi.fn(),
  useMyNotificationsMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('@/hooks/useNotifications', () => ({
  useMyNotifications: (...args: unknown[]) => useMyNotificationsMock(...args),
  useMarkRead: () => ({ mutate }),
}));

function makeNotification(id: string, type: string) {
  return {
    id,
    type,
    payload: {},
    channel: 'PUSH',
    status: 'SENT',
    sentAt: null,
    readAt: null,
    createdAt: '2026-10-06T10:00:00.000Z',
  };
}

function mockData(total: number, notifications = [makeNotification('n1', 'NEW_MESSAGE')]) {
  useMyNotificationsMock.mockReturnValue({
    data: { notifications, page: 1, limit: 20, total },
  });
}

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NotificationBell', () => {
  it('polls unread notifications every 30s', () => {
    mockData(1);
    renderBell();
    expect(useMyNotificationsMock).toHaveBeenCalledWith(true, 1, { refetchInterval: 30_000 });
  });

  it('caps the badge at 9+ for counts above 9', () => {
    mockData(14);
    renderBell();
    expect(screen.getByTestId('notification-badge')).toHaveTextContent('9+');
    expect(screen.queryByText('14')).toBeNull();
  });

  it('shows the exact count at 9', () => {
    mockData(9);
    renderBell();
    expect(screen.getByTestId('notification-badge')).toHaveTextContent('9');
    expect(screen.queryByText('9+')).toBeNull();
  });

  it('hides the badge when there are no unread notifications', () => {
    mockData(0, []);
    renderBell();
    expect(screen.queryByTestId('notification-badge')).toBeNull();
  });

  it('marks read then navigates to /messaging for NEW_MESSAGE', () => {
    mockData(1);
    renderBell();

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /new message/i }));

    expect(mutate).toHaveBeenCalledWith('n1');
    expect(navigate).toHaveBeenCalledWith('/messaging');
    expect(mutate.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0]);
  });

  it('falls back to /notifications for an unmapped type', () => {
    mockData(1, [makeNotification('n2', 'CLASS_REMINDER')]);
    renderBell();

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /class reminder/i }));

    expect(navigate).toHaveBeenCalledWith('/notifications');
  });

  it('closes the dropdown on Escape', () => {
    mockData(1);
    renderBell();

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
