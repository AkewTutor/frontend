import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PeopleManagementPage from '@/pages/admin/PeopleManagementPage';
import type { AdminUser } from '@/types';

const mocks = vi.hoisted(() => ({
  users: vi.fn(),
  suspend: { mutate: vi.fn(), isPending: false },
  reactivate: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/useAdminPeople', () => ({
  useUsers: (...a: unknown[]) => mocks.users(...a),
  useSuspendAccount: () => mocks.suspend,
  useReactivateAccount: () => mocks.reactivate,
}));

const user: AdminUser = {
  id: 'u1',
  role: 'TUTOR',
  email: 'tutor@b.co',
  phone: null,
  createdAt: '2026-01-05T10:00:00.000Z',
  status: 'ACTIVE',
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
    expect(mocks.users).toHaveBeenLastCalledWith(1, undefined, undefined);
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'TUTOR' } });
    expect(mocks.users).toHaveBeenLastCalledWith(1, 'TUTOR', undefined);
  });

  it('searches on submit with a trimmed term', () => {
    render(<PeopleManagementPage />);
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: '  amy@b.co ' } });
    expect(mocks.users).toHaveBeenLastCalledWith(1, undefined, undefined);
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(mocks.users).toHaveBeenLastCalledWith(1, undefined, 'amy@b.co');
  });

  it('goes back to page 1 when a search is submitted', () => {
    mocks.users.mockReturnValue({
      data: { users: [user], page: 1, limit: 20, total: 60 },
      isLoading: false,
      isError: false,
    });
    render(<PeopleManagementPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(mocks.users).toHaveBeenLastCalledWith(2, undefined, undefined);
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'amy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(mocks.users).toHaveBeenLastCalledWith(1, undefined, 'amy');
  });

  it('Clear empties the box and removes the search term', () => {
    render(<PeopleManagementPage />);
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'amy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByLabelText('Search')).toHaveValue('');
    expect(mocks.users).toHaveBeenLastCalledWith(1, undefined, undefined);
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

it('shows Reactivate (not Suspend) for a suspended account and fires it', () => {
  withUsers([{ ...user, id: 'u2', status: 'SUSPENDED' }]);
  render(<PeopleManagementPage />);

  expect(screen.queryByRole('button', { name: 'Suspend' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reactivate' }));
  expect(mocks.reactivate.mutate.mock.calls[0][0]).toBe('u2');
});
