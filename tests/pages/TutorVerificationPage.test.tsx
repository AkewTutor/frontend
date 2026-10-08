import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TutorVerificationCard from '@/components/accounts/TutorVerificationCard';
import type { PendingTutor } from '@/types';

const tutor: PendingTutor = {
  id: 't1',
  userId: 'u1',
  experienceDescription: '5 years teaching maths',
  educationInstitution: 'Addis Ababa University',
  verificationStatus: 'PENDING',
  createdAt: '2026-01-05T10:00:00.000Z',
};

function setup(overrides: Partial<PendingTutor> = {}) {
  const onApprove = vi.fn();
  const onReject = vi.fn();
  render(
    <TutorVerificationCard
      tutor={{ ...tutor, ...overrides }}
      onApprove={onApprove}
      onReject={onReject}
    />
  );
  return { onApprove, onReject };
}

describe('TutorVerificationCard', () => {
  it('approves immediately, with no confirmation dialog', () => {
    const { onApprove } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not reject until a non-empty reason is entered', () => {
    const { onReject } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

    const confirm = screen.getByRole('button', { name: 'Confirm reject' });
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(onReject).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Rejection reason'), { target: { value: '   ' } });
    expect(confirm).toBeDisabled();
    expect(onReject).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Rejection reason'), {
      target: { value: '  Documents unclear ' },
    });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onReject).toHaveBeenCalledWith('Documents unclear');
  });

  it('cancel returns to Approve/Reject and clears the reason', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    fireEvent.change(screen.getByLabelText('Rejection reason'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    expect(screen.getByLabelText('Rejection reason')).toHaveValue('');
  });

  it('shows "Not provided" for missing profile fields', () => {
    setup({ educationInstitution: null, experienceDescription: null });
    expect(screen.getAllByText('Not provided')).toHaveLength(2);
  });
});
