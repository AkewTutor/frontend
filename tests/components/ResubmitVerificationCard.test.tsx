import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResubmitVerificationCard from '@/components/accounts/ResubmitVerificationCard';

const mutate = vi.fn();
vi.mock('@/hooks/useTutorProfile', () => ({
  useResubmitVerification: () => ({ mutate, isPending: false }),
}));

const openAndConfirm = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Resubmit for review' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
};

describe('ResubmitVerificationCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('REJECTED shows an enabled action', () => {
    render(<ResubmitVerificationCard verificationStatus="REJECTED" hasUnsavedChanges={false} />);
    expect(screen.getByRole('button', { name: 'Resubmit for review' })).toBeEnabled();
  });

  it('PENDING is read-only', () => {
    render(<ResubmitVerificationCard verificationStatus="PENDING" hasUnsavedChanges={false} />);
    expect(screen.getByText(/under review/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('VERIFIED renders nothing', () => {
    const { container } = render(
      <ResubmitVerificationCard verificationStatus="VERIFIED" hasUnsavedChanges={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('unsaved edits disable the button and flipping the prop enables it', () => {
    const { rerender } = render(
      <ResubmitVerificationCard verificationStatus="REJECTED" hasUnsavedChanges />
    );
    expect(screen.getByRole('button', { name: 'Resubmit for review' })).toBeDisabled();
    expect(screen.getByText('Save your changes first')).toBeInTheDocument();

    rerender(<ResubmitVerificationCard verificationStatus="REJECTED" hasUnsavedChanges={false} />);
    expect(screen.getByRole('button', { name: 'Resubmit for review' })).toBeEnabled();
  });

  it('only mutates after the confirm dialog is accepted', () => {
    render(<ResubmitVerificationCard verificationStatus="REJECTED" hasUnsavedChanges={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Resubmit for review' }));
    expect(mutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mutate).not.toHaveBeenCalled();

    openAndConfirm();
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('shows the 409 message, not a generic error', async () => {
    mutate.mockImplementation((_v, opts) => opts.onError({ response: { status: 409 } }));
    render(<ResubmitVerificationCard verificationStatus="REJECTED" hasUnsavedChanges={false} />);
    openAndConfirm();

    expect(await screen.findByText('This application was already resubmitted')).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).toBeNull();
  });

  it('never displays a rejection reason', async () => {
    const extra = { reason: 'internal-note-123' };
    render(
      <ResubmitVerificationCard
        verificationStatus="REJECTED"
        hasUnsavedChanges={false}
        {...(extra as object)}
      />
    );
    await waitFor(() => expect(screen.queryByText(/internal-note-123/)).toBeNull());
  });
});
