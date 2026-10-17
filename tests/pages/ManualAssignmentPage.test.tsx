import { fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ManualAssignmentPage from '@/pages/admin/ManualAssignmentPage';

const { useUsersMock, useSubjectsMock, mutateMock } = vi.hoisted(() => ({
  useUsersMock: vi.fn(),
  useSubjectsMock: vi.fn(),
  mutateMock: vi.fn(),
}));

vi.mock('@/hooks/useAdminPeople', () => ({
  useUsers: (...args: unknown[]) => useUsersMock(...args),
}));
vi.mock('@/hooks/useSubjects', () => ({
  useSubjects: () => useSubjectsMock(),
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
  useSubjectsMock.mockReturnValue({
    data: { subjects: [{ id: 'sub-1', name: 'Geography', isActive: true }] },
    isLoading: false,
    isError: false,
  });
  useUsersMock.mockImplementation((_page: number, role: string) =>
    role === 'TUTOR'
      ? ok([user('t1', 'TUTOR', 'tutor@x.com')])
      : ok([user('s1', 'STUDENT', 'ann@x.com'), user('s2', 'STUDENT', null, '+251911')])
  );
});

const pickSubject = () =>
  fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'sub-1' } });

function fillAndAssign() {
  pickSubject();
  fireEvent.click(screen.getByRole('button', { name: 'tutor@x.com' }));
  fireEvent.click(screen.getByRole('button', { name: 'ann@x.com' }));
  fireEvent.click(screen.getByRole('button', { name: 'Assign' }));
}

describe('ManualAssignmentPage', () => {
  it('has no top search box and lists subjects to choose from', () => {
    render(<ManualAssignmentPage />);
    expect(screen.queryByLabelText('Search people')).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Geography' })).toBeInTheDocument();
  });

  it('limits both lists to the chosen subject', () => {
    render(<ManualAssignmentPage />);
    pickSubject();
    expect(useUsersMock).toHaveBeenCalledWith(1, 'TUTOR', undefined, 'sub-1');
    expect(useUsersMock).toHaveBeenCalledWith(1, 'STUDENT', undefined, 'sub-1');
  });

  it('suggests people labelled by email, then phone', () => {
    render(<ManualAssignmentPage />);
    pickSubject();
    expect(screen.getByRole('button', { name: 'tutor@x.com' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+251911' })).toBeInTheDocument();
  });

  it('re-queries each list with what is typed in its own box', () => {
    render(<ManualAssignmentPage />);
    pickSubject();
    fireEvent.change(screen.getByLabelText('Tutor'), { target: { value: ' abel ' } });
    expect(useUsersMock).toHaveBeenCalledWith(1, 'TUTOR', 'abel', 'sub-1');
    fireEvent.change(screen.getByLabelText('Student'), { target: { value: 'ann' } });
    expect(useUsersMock).toHaveBeenCalledWith(1, 'STUDENT', 'ann', 'sub-1');
  });

  it('submits { tutorId, studentIds, subjectId, format }', () => {
    render(<ManualAssignmentPage />);
    fillAndAssign();
    expect(mutateMock).toHaveBeenCalledWith(
      { tutorId: 't1', studentIds: ['s1'], subjectId: 'sub-1', format: 'ONE_TO_ONE' },
      expect.any(Object)
    );
  });

  it('toasts success and resets the form', () => {
    mutateMock.mockImplementation((_v, opts) => opts.onSuccess());
    render(<ManualAssignmentPage />);
    fillAndAssign();
    expect(toast.success).toHaveBeenCalled();
    expect(screen.getByLabelText('Subject')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Remove ann@x.com' })).not.toBeInTheDocument();
  });

  it('toasts the server message on error and keeps the form', () => {
    mutateMock.mockImplementation((_v, opts) =>
      opts.onError({ response: { data: { message: 'Tutor is not verified' } } })
    );
    render(<ManualAssignmentPage />);
    fillAndAssign();
    expect(toast.error).toHaveBeenCalledWith('Tutor is not verified');
    expect(screen.getByLabelText('Subject')).toHaveValue('sub-1');
  });

  it('shows an error line when subjects fail to load', () => {
    useSubjectsMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ManualAssignmentPage />);
    expect(screen.getByText(/couldn.t load subjects/i)).toBeInTheDocument();
  });
});
