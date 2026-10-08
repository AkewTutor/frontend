import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PeopleManagementPage from '@/pages/admin/PeopleManagementPage';
import type { AdminUser } from '@/types';

const mocks = vi.hoisted(() => ({
  users: vi.fn(),
  suspend: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/useAdminPeople', () => ({
  useUsers: (...a: unknown[]) => mocks.users(...a),
  useSuspendAccount: () => mocks.suspend,
}));

const user: AdminUser = {
  id: 'u1',
  role: 'TUTOR',
  email: 'tutor@b.co',
  phone: null,
  createdAt: '2026-01-05T10:00:00.000Z',
};

const withUsers = (users: AdminUser[]) =>
  mocks.users.mockReturnValue({
    data: { users, page: 1, limit: 20, total: users.length },
    isLoading: false,
    isError: false,
  });

beforeEach(() => {
  vi.clearAllMocks();
  withUsers([user]);
});

describe('PeopleManagementPage', () => {
  it('lists people with their contact', () => {
    render(<PeopleManagementPage />);
    expect(screen.getByText('tutor@b.co')).toBeInTheDocument();
  });

  it('re-queries with the selected role filter', () => {
    render(<PeopleManagementPage />);
    expect(mocks.users).toHaveBeenLastCalledWith(1, undefined);
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'TUTOR' } });
    expect(mocks.users).toHaveBeenLastCalledWith(1, 'TUTOR');
  });

  it('does not suspend until a non-empty reason is entered', () => {
    render(<PeopleManagementPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));

    const confirm = screen.getByRole('button', { name: 'Confirm suspend' });
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(mocks.suspend.mutate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: '   ' } });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: ' Fraud ' } });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(mocks.suspend.mutate.mock.calls[0][0]).toEqual({
      userId: 'u1',
      reason: 'Fraud',
      restrictionType: 'SUSPENDED',
    });
  });

  it('sends the chosen restriction type', () => {
    render(<PeopleManagementPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));
    fireEvent.change(screen.getByLabelText('Restriction'), { target: { value: 'RESTRICTED' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Policy breach' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm suspend' }));
    expect(mocks.suspend.mutate.mock.calls[0][0]).toMatchObject({ restrictionType: 'RESTRICTED' });
  });

  it('renders an EmptyState for an empty result', () => {
    withUsers([]);
    render(<PeopleManagementPage />);
    expect(screen.getByText('No people match this filter.')).toBeInTheDocument();
  });
});
