import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SubjectManagementPage from '@/pages/admin/SubjectManagementPage';

const mocks = vi.hoisted(() => ({
  subjects: vi.fn(),
  create: { mutate: vi.fn(), isPending: false },
  setActive: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/useSubjects', () => ({
  useSubjects: (...a: unknown[]) => mocks.subjects(...a),
  useCreateSubject: () => mocks.create,
  useSetSubjectActive: () => mocks.setActive,
}));

const mixed = [
  { id: 's1', name: 'Algebra', isActive: true },
  { id: 's2', name: 'Biology', isActive: false },
];

const withSubjects = (subjects: typeof mixed) =>
  mocks.subjects.mockReturnValue({ data: { subjects }, isLoading: false, isError: false });

beforeEach(() => {
  vi.clearAllMocks();
  withSubjects(mixed);
});

describe('SubjectManagementPage', () => {
  it('requests the full list including inactive subjects', () => {
    render(<SubjectManagementPage />);
    expect(mocks.subjects).toHaveBeenCalledWith({ includeInactive: true });
  });

  it('shows both active and inactive rows with the right action', () => {
    render(<SubjectManagementPage />);
    expect(screen.getByText('Algebra')).toBeInTheDocument();
    expect(screen.getByText('Biology')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reactivate' })).toBeInTheDocument();
  });

  it('sends the explicit target state', () => {
    render(<SubjectManagementPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    expect(mocks.setActive.mutate.mock.calls[0][0]).toEqual({ id: 's1', isActive: false });
    fireEvent.click(screen.getByRole('button', { name: 'Reactivate' }));
    expect(mocks.setActive.mutate.mock.calls[1][0]).toEqual({ id: 's2', isActive: true });
  });

  it('disables only the acting row while pending', () => {
    render(<SubjectManagementPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reactivate' })).toBeEnabled();
  });

  it('trims the name, blocks blanks and clears the field on success', () => {
    mocks.create.mutate.mockImplementation((_n, o) => o?.onSuccess?.());
    render(<SubjectManagementPage />);
    const input = screen.getByLabelText('New subject') as HTMLInputElement;
    const add = screen.getByRole('button', { name: 'Add subject' });

    fireEvent.change(input, { target: { value: '  ' } });
    expect(add).toBeDisabled();

    fireEvent.change(input, { target: { value: '  Chemistry ' } });
    fireEvent.click(add);
    expect(mocks.create.mutate.mock.calls[0][0]).toBe('Chemistry');
    expect(input.value).toBe('');
  });

  it('shows a 409 message inline, keeps the value and clears the message on edit', () => {
    mocks.create.mutate.mockImplementation((_n, o) =>
      o?.onError?.({
        response: { status: 409, data: { message: 'A subject with this name already exists' } },
      })
    );
    render(<SubjectManagementPage />);
    const input = screen.getByLabelText('New subject') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Algebra' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add subject' }));

    expect(screen.getByRole('alert').textContent).toBe('A subject with this name already exists');
    expect(input.value).toBe('Algebra');

    fireEvent.change(input, { target: { value: 'Algebra 2' } });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders an EmptyState for an empty catalog', () => {
    withSubjects([]);
    render(<SubjectManagementPage />);
    expect(screen.getByText('No subjects yet')).toBeInTheDocument();
  });
});
