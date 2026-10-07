import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import { ROUTES } from '@/constants';
import api from '@/lib/axios';

vi.mock('@/lib/axios', () => ({ default: { post: vi.fn() } }));

const post = vi.mocked(api.post);

function ResetStub() {
  const location = useLocation();
  const state = location.state as { identifier?: string } | null;
  return (
    <div>
      <div data-testid="location">{location.pathname}</div>
      <div data-testid="identifier">{state?.identifier}</div>
    </div>
  );
}

function TestSetup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ROUTES.FORGOT_PASSWORD]}>
        <Routes>
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ForgotPasswordPage', () => {
  it('redirects to the reset page with the identifier after submit', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: {} });
    render(<TestSetup />);

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));

    expect(post).toHaveBeenCalledWith('/auth/forgot-password', { identifier: 'me@test.com' });

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(ROUTES.RESET_PASSWORD);
    });
    expect(screen.getByTestId('identifier')).toHaveTextContent('me@test.com');
  });
});
