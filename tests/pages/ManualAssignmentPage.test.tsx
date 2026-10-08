import { fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ManualAssignmentPage from '@/pages/admin/ManualAssignmentPage';

const { useUsersMock, mutateMock } = vi.hoisted(() => ({
  useUsersMock: vi.fn(),
  mutateMock: vi.fn(),
}));

vi.mock('@/hooks/useAdminPeople', () => ({
  useUsers: (...args: unknown[]) => useUsersMock(...args),
}));
vi.mock('@/hooks/useAdminMatching', () => ({
  useManualAssign: () => ({ mutate: mutateMock, isPending: false }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const user = (id: string, role: string, email: string | null, phone: string | null = null) => ({
  id,
  role,
  email,
  phone,
  createdAt: '2026-08-01T10:00:00Z',
});

function ok(users: ReturnType<typeof user>[]) {
  return {
    data: { users, page: 1, limit: 20, total: users.length },
    isLoading: false,
    isError: false,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useUsersMock.mockImplementation((_page: number, role: string) =>
    role === 'TUTOR'
      ? ok([user('t1', 'TUTOR', 'tutor@x.com')])
      : ok([user('s1', 'STUDENT', 'ann@x.com'), user('s2', 'STUDENT', null, '+251911')])
  );
});

function fillAndAssign() {
  fireEvent.change(screen.getByLabelText('Tutor'), { target: { value: 't1' } });
  fireEvent.click(screen.getByLabelText('ann@x.com'));
  fireEvent.click(screen.getByRole('button', { name: 'Assign' }));
}

describe('ManualAssignmentPage', () => {
  it('loads tutors and students and labels them by email, then phone', () => {
    render(<ManualAssignmentPage />);
    expect(useUsersMock).toHaveBeenCalledWith(1, 'TUTOR', undefined);
    expect(useUsersMock).toHaveBeenCalledWith(1, 'STUDENT', undefined);
    expect(screen.getByRole('option', { name: 'tutor@x.com' })).toBeInTheDocument();
    expect(screen.getByLabelText('+251911')).toBeInTheDocument();
  });

  it('re-queries both lists with the committed search term', () => {
    render(<ManualAssignmentPage />);
    fireEvent.change(screen.getByLabelText('Search people'), { target: { value: ' ann ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(useUsersMock).toHaveBeenCalledWith(1, 'TUTOR', 'ann');
    expect(useUsersMock).toHaveBeenCalledWith(1, 'STUDENT', 'ann');
  });

  it('submits { tutorId, studentIds, format }', () => {
    render(<ManualAssignmentPage />);
    fillAndAssign();
    expect(mutateMock).toHaveBeenCalledWith(
      { tutorId: 't1', studentIds: ['s1'], format: 'ONE_TO_ONE' },
      expect.any(Object)
    );
  });

  it('toasts success and resets the form', () => {
    mutateMock.mockImplementation((_v, opts) => opts.onSuccess());
    render(<ManualAssignmentPage />);
    fillAndAssign();
    expect(toast.success).toHaveBeenCalled();
    expect(screen.getByLabelText('Tutor')).toHaveValue('');
    expect(screen.getByLabelText('ann@x.com')).not.toBeChecked();
  });

  it('toasts the server message on error and keeps the form', () => {
    mutateMock.mockImplementation((_v, opts) =>
      opts.onError({ response: { data: { message: 'Tutor is not verified' } } })
    );
    render(<ManualAssignmentPage />);
    fillAndAssign();
    expect(toast.error).toHaveBeenCalledWith('Tutor is not verified');
    expect(screen.getByLabelText('Tutor')).toHaveValue('t1');
  });

  it('shows an error line when people fail to load', () => {
    useUsersMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ManualAssignmentPage />);
    expect(screen.getByText(/couldn.t load people/i)).toBeInTheDocument();
  });
});
