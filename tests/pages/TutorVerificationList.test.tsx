import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TutorVerificationPage from '@/pages/admin/TutorVerificationPage';
import type { PendingTutor } from '@/types';

const mocks = vi.hoisted(() => ({
  pending: vi.fn(),
  approve: { mutate: vi.fn(), isPending: false },
  reject: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/useAdminTutorVerification', () => ({
  usePendingTutors: (...a: unknown[]) => mocks.pending(...a),
  useApproveTutor: () => mocks.approve,
  useRejectTutor: () => mocks.reject,
}));

const tutor = (id: string): PendingTutor => ({
  id,
  userId: `u-${id}`,
  experienceDescription: '5 years',
  educationInstitution: 'Addis Ababa University',
  verificationStatus: 'PENDING',
  createdAt: '2026-01-05T10:00:00.000Z',
});

const withTutors = (tutors: PendingTutor[]) =>
  mocks.pending.mockReturnValue({
    data: { tutors, page: 1, limit: 20, total: tutors.length },
    isLoading: false,
    isError: false,
  });

beforeEach(() => vi.clearAllMocks());

describe('TutorVerificationPage', () => {
  it('renders an EmptyState, not an error, for an empty queue', () => {
    withTutors([]);
    render(<TutorVerificationPage />);
    expect(screen.getByText('No tutors are waiting for review.')).toBeInTheDocument();
    expect(screen.queryByText(/couldn.t load/i)).toBeNull();
  });

  it('renders one card per pending tutor', () => {
    withTutors([tutor('t1'), tutor('t2')]);
    render(<TutorVerificationPage />);
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('approves with the tutor id', () => {
    withTutors([tutor('t1')]);
    render(<TutorVerificationPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(mocks.approve.mutate.mock.calls[0][0]).toBe('t1');
  });

  it('rejects with the tutor id and the trimmed reason', () => {
    withTutors([tutor('t1')]);
    render(<TutorVerificationPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    fireEvent.change(screen.getByLabelText('Rejection reason'), {
      target: { value: ' Documents unclear ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reject' }));
    expect(mocks.reject.mutate.mock.calls[0][0]).toEqual({
      tutorId: 't1',
      reason: 'Documents unclear',
    });
  });

  it('shows loading and error states', () => {
    mocks.pending.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { rerender } = render(<TutorVerificationPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    mocks.pending.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    rerender(<TutorVerificationPage />);
    expect(screen.getByText(/couldn.t load/i)).toBeInTheDocument();
  });
});
