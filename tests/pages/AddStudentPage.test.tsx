import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AddStudentPage from '@/pages/parent/AddStudentPage';

const mocks = vi.hoisted(() => ({ add: { mutate: vi.fn(), isPending: false } }));
vi.mock('@/hooks/useGuardianship', () => ({ useAddStudent: () => mocks.add }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.add.mutate.mockImplementation((_b, o) => o?.onSuccess?.({ relationshipId: 'rel-1' }));
});

async function submit(grade: string) {
  fireEvent.change(screen.getByLabelText('Grade'), { target: { value: grade } });
  fireEvent.change(screen.getByLabelText(/email or phone/i), { target: { value: 'kid@b.co' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add student' }));
  await screen.findByRole('status');
}

describe('AddStudentPage', () => {
  it('mentions the activation invite for grade 8', async () => {
    render(<AddStudentPage />);
    await submit('8');
    expect(screen.getByText(/activation invite/i)).toBeInTheDocument();
    expect(mocks.add.mutate.mock.calls[0][0]).toEqual({ grade: 8, inviteContact: 'kid@b.co' });
  });

  it('does not mention an activation invite for grade 3', async () => {
    render(<AddStudentPage />);
    await submit('3');
    expect(screen.getByText(/Reference: rel-1/)).toBeInTheDocument();
    expect(screen.queryByText(/activation invite/i)).toBeNull();
  });

  it('resets the form after success and stays on the page', async () => {
    render(<AddStudentPage />);
    await submit('8');
    await waitFor(() =>
      expect((screen.getByLabelText('Grade') as HTMLInputElement).value).toBe('')
    );
    expect((screen.getByLabelText(/email or phone/i) as HTMLInputElement).value).toBe('');
    expect(screen.getByRole('button', { name: 'Add student' })).toBeInTheDocument();
  });

  it('blocks an out-of-range grade', async () => {
    render(<AddStudentPage />);
    fireEvent.change(screen.getByLabelText('Grade'), { target: { value: '13' } });
    fireEvent.change(screen.getByLabelText(/email or phone/i), { target: { value: 'kid@b.co' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add student' }));
    expect(await screen.findByText('Grade must be 1–12')).toBeInTheDocument();
    expect(mocks.add.mutate).not.toHaveBeenCalled();
  });
});
