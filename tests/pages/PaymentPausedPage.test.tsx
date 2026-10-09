import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PaymentPausedPage from '@/pages/PaymentPausedPage';
import { useAuthStore } from '@/store/auth.store';

const mocks = vi.hoisted(() => ({ pause: vi.fn() }));
vi.mock('@/hooks/usePayments', () => ({ usePaymentPause: () => mocks.pause() }));

function setup(state: object) {
  useAuthStore.setState({ user: { id: 'u1', email: 'a@b.co', phone: null, role: 'STUDENT' } });
  mocks.pause.mockReturnValue({
    isLoading: false,
    isError: false,
    isPaused: false,
    pauses: [],
    ...state,
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <PaymentPausedPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PaymentPausedPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('blocks with a pay link while paused', () => {
    setup({ isPaused: true, pauses: [{ isPaused: true, affectedSessions: [{}, {}] }] });
    expect(screen.getByRole('alert')).toHaveTextContent(/paused until payment/i);
    expect(screen.getByText(/2 session\(s\)/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pay now' })).toBeInTheDocument();
  });

  it('shows up-to-date when not paused', () => {
    setup({});
    expect(screen.getByText('Your payments are up to date.')).toBeInTheDocument();
  });
});
