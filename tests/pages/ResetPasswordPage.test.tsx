import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import ResetPasswordPage from '@/pages/ResetPasswordPage';
import { ROUTES } from '@/constants';
import api from '@/lib/axios';

vi.mock('@/lib/axios', () => ({ default: { post: vi.fn() } }));

const post = vi.mocked(api.post);

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function TestSetup({ initialEntry }: { initialEntry: string }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="*" element={<ResetPasswordPage />} />
          <Route path={ROUTES.LOGIN} element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function httpError(status: number) {
  return new AxiosError('Error', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: {} as never,
    data: { message: 'Error' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ResetPasswordPage', () => {
  it('renders missing userId message', () => {
    render(<TestSetup initialEntry="/reset-password?code=123" />);
    expect(screen.getByText(/this reset link is no longer valid/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to forgot password/i })).toBeInTheDocument();
  });

  it('reads userId and code from searchParams and pre-fills code', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: {} });
    render(<TestSetup initialEntry="/reset-password?userId=u1&code=123456" />);

    expect(screen.getByLabelText(/reset code/i)).toHaveValue('123456');

    await user.type(screen.getByLabelText(/new password/i), 'new-secret-123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(post).toHaveBeenCalledWith('/auth/reset-password', {
      userId: 'u1',
      code: '123456',
      newPassword: 'new-secret-123',
    });
  });

  it('400 error sets field-level error on code', async () => {
    const user = userEvent.setup();
    post.mockRejectedValue(httpError(400));
    render(<TestSetup initialEntry="/reset-password?userId=u1&code=123456" />);

    await user.type(screen.getByLabelText(/new password/i), 'new-secret-123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText('Invalid or expired code')).toBeInTheDocument();
  });

  it('navigates to login on success', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: {} });
    render(<TestSetup initialEntry="/reset-password?userId=u1&code=123456" />);

    await user.type(screen.getByLabelText(/new password/i), 'new-secret-123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(ROUTES.LOGIN);
    });
  });
});
