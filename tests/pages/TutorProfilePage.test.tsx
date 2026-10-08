import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TutorProfilePage from '@/pages/tutor/TutorProfilePage';
import type { TutorProfile } from '@/types';

const mocks = vi.hoisted(() => ({
  profile: {} as TutorProfile,
  update: { mutate: vi.fn(), isPending: false },
  resubmit: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/useTutorProfile', () => ({
  useMyTutorProfile: () => ({ data: mocks.profile, isLoading: false, isError: false }),
  useUpdateTutorProfile: () => mocks.update,
  useResubmitVerification: () => mocks.resubmit,
}));

const base: TutorProfile = {
  id: 't1',
  userId: 'u1',
  profilePictureUrl: null,
  bio: 'Maths tutor',
  experienceDescription: '5 years',
  educationInstitution: 'AAU',
  degree: 'BSc',
  verificationStatus: 'PENDING',
  verifiedAt: null,
};

const setStatus = (s: TutorProfile['verificationStatus']) => {
  mocks.profile = { ...base, verificationStatus: s };
};

beforeEach(() => {
  vi.clearAllMocks();
  setStatus('PENDING');
});

describe('TutorProfilePage', () => {
  it.each([
    ['PENDING', false],
    ['VERIFIED', false],
    ['REJECTED', true],
  ] as const)('resubmit card for %s: %s', (status, expected) => {
    setStatus(status);
    render(<TutorProfilePage />);
    expect(!!screen.queryByRole('button', { name: 'Resubmit for review' })).toBe(expected);
  });

  it('disables resubmit while the form is dirty and enables it after saving', async () => {
    setStatus('REJECTED');
    mocks.update.mutate.mockImplementation((_b, o) => o?.onSuccess?.());
    render(<TutorProfilePage />);
    const resubmit = screen.getByRole('button', {
      name: 'Resubmit for review',
    }) as HTMLButtonElement;
    expect(resubmit.disabled).toBe(false);

    fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'Updated bio' } });
    await waitFor(() => expect(resubmit.disabled).toBe(true));

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(resubmit.disabled).toBe(false));
  });

  it('shows the under-review state and a Pending badge after a refetch to PENDING', () => {
    setStatus('REJECTED');
    const { rerender } = render(<TutorProfilePage />);
    expect(screen.getByRole('button', { name: 'Resubmit for review' })).toBeTruthy();

    setStatus('PENDING');
    rerender(<TutorProfilePage />);
    expect(screen.queryByRole('button', { name: 'Resubmit for review' })).toBeNull();
    expect(screen.getByText('Your application is under review.')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
  });

  it('reads VERIFIED as Verified, never Approved', () => {
    setStatus('VERIFIED');
    render(<TutorProfilePage />);
    expect(screen.getByText('Verified')).toBeTruthy();
    expect(screen.queryByText(/approved/i)).toBeNull();
  });

  it('never exposes or sends verificationStatus', async () => {
    render(<TutorProfilePage />);
    expect(screen.queryByLabelText(/status/i)).toBeNull();

    fireEvent.change(screen.getByLabelText('Degree'), { target: { value: 'MSc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(mocks.update.mutate).toHaveBeenCalledTimes(1));
    const body = mocks.update.mutate.mock.calls[0][0];
    expect(body).toMatchObject({ degree: 'MSc' });
    expect(body).not.toHaveProperty('verificationStatus');
  });
});
