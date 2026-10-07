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

function TestSetup({ identifier }: { identifier?: string }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const entry = identifier
    ? { pathname: ROUTES.RESET_PASSWORD, state: { identifier, sent: true } }
    : ROUTES.RESET_PASSWORD;

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
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

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  password = 'new-secret-123',
  confirm = password
) {
  await user.type(screen.getByLabelText(/reset code/i), '123456');
  await user.type(screen.getByLabelText(/^new password/i), password);
  await user.type(screen.getByLabelText(/confirm password/i), confirm);
  await user.click(screen.getByRole('button', { name: /reset password/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ResetPasswordPage', () => {
  it('prefills the identifier from router state and shows the sent notice', () => {
    render(<TestSetup identifier="me@test.com" />);
    expect(screen.getByLabelText(/email or phone/i)).toHaveValue('me@test.com');
    expect(screen.getByText(/a reset code has been sent/i)).toBeInTheDocument();
  });

  it('works without router state: identifier can be typed', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: {} });
    render(<TestSetup />);

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await fill(user);

    expect(post).toHaveBeenCalledWith('/auth/reset-password', {
      identifier: 'me@test.com',
      code: '123456',
      newPassword: 'new-secret-123',
    });
  });

  it('blocks submit when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<TestSetup identifier="me@test.com" />);

    await fill(user, 'new-secret-123', 'different-123');

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('400 error sets field-level error on code', async () => {
    const user = userEvent.setup();
    post.mockRejectedValue(httpError(400));
    render(<TestSetup identifier="me@test.com" />);

    await fill(user);

    expect(await screen.findByText('Invalid or expired code')).toBeInTheDocument();
  });

  it('429 shows a rate-limit message', async () => {
    const user = userEvent.setup();
    post.mockRejectedValue(httpError(429));
    render(<TestSetup identifier="me@test.com" />);

    await fill(user);

    expect(await screen.findByText(/too many attempts/i)).toBeInTheDocument();
  });

  it('navigates to login on success', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: {} });
    render(<TestSetup identifier="me@test.com" />);

    await fill(user);

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(ROUTES.LOGIN);
    });
  });
});
