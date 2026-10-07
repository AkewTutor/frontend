import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FormatSwitchPage from '@/pages/student/FormatSwitchPage';

const { mutate, isPendingRef } = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPendingRef: { current: false },
}));

vi.mock('@/hooks/useFormatSwitch', () => ({
  useRequestFormatSwitch: () => ({ mutate, isPending: isPendingRef.current }),
}));

function renderPage(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/student/format-switch', state }]}>
      <FormatSwitchPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  isPendingRef.current = false;
});

describe('FormatSwitchPage', () => {
  it("pre-fills the target from the current format's next option", () => {
    renderPage({ cohortId: 'c1', format: 'ONE_TO_ONE' });
    expect(screen.getByLabelText('Target format')).toHaveValue('ONE_TO_THREE');
  });

  it('submits the final selection, not the original pre-fill', () => {
    renderPage({ cohortId: 'c1', format: 'ONE_TO_ONE' });
    fireEvent.change(screen.getByLabelText('Target format'), { target: { value: 'ONE_TO_FIVE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request switch' }));
    expect(mutate).toHaveBeenCalledWith(
      { cohortId: 'c1', targetFormat: 'ONE_TO_FIVE' },
      expect.any(Object)
    );
  });

  it('does not offer the current format as a target', () => {
    renderPage({ cohortId: 'c1', format: 'ONE_TO_ONE' });
    expect(screen.queryByRole('option', { name: '1-to-1' })).toBeNull();
  });

  it('shows a confirmation with a link back to group status on success', () => {
    mutate.mockImplementation((_body, opts) => opts.onSuccess());
    renderPage({ cohortId: 'c1', format: 'ONE_TO_ONE' });
    fireEvent.click(screen.getByRole('button', { name: 'Request switch' }));
    expect(screen.getByText(/has been submitted/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to group status' })).toHaveAttribute(
      'href',
      '/student/group-status'
    );
  });

  it('shows an inline error and keeps the form on failure', () => {
    mutate.mockImplementation((_body, opts) => opts.onError());
    renderPage({ cohortId: 'c1', format: 'ONE_TO_ONE' });
    fireEvent.click(screen.getByRole('button', { name: 'Request switch' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn.t submit/i);
    expect(screen.getByLabelText('Target format')).toBeInTheDocument();
  });

  it('disables the button while submitting', () => {
    isPendingRef.current = true;
    renderPage({ cohortId: 'c1', format: 'ONE_TO_ONE' });
    expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled();
  });

  it('shows a way back instead of the form when opened without router state', () => {
    renderPage();
    expect(screen.queryByLabelText('Target format')).toBeNull();
    expect(screen.getByRole('link', { name: 'Go to group status' })).toBeInTheDocument();
  });
});
