import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PaymentPauseGuard from '@/components/payments/PaymentPauseGuard';
import { ROUTES } from '@/constants';
import { useAuthStore } from '@/store/auth.store';

const mocks = vi.hoisted(() => ({ pause: vi.fn() }));
vi.mock('@/hooks/usePayments', () => ({ usePaymentPause: (id?: string) => mocks.pause(id) }));

function setup(isPaused: boolean, role: 'STUDENT' | 'PARENT' = 'STUDENT', url = '/guarded') {
  useAuthStore.setState({ user: { id: 'u1', email: 'a@b.co', phone: null, role } });
  mocks.pause.mockReturnValue({ isLoading: false, isError: false, isPaused, pauses: [] });
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/guarded" element={<PaymentPauseGuard>content</PaymentPauseGuard>} />
        <Route path={ROUTES.PAYMENT_PAUSED} element={<p>paused screen</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PaymentPauseGuard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('redirects to the paused screen when paused', () => {
    setup(true);
    expect(screen.getByText('paused screen')).toBeInTheDocument();
  });

  it('renders children when not paused', () => {
    setup(false);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('does not check a Parent who has not chosen a child', () => {
    setup(true, 'PARENT');
    expect(mocks.pause).not.toHaveBeenCalled();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
