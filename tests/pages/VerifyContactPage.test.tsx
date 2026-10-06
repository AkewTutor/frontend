import { toast } from 'sonner';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Toaster } from 'sonner';

import VerifyContactPage from '@/pages/VerifyContactPage';
import { ROUTES } from '@/constants';
import api from '@/lib/axios';

vi.mock('@/lib/axios', () => ({ default: { post: vi.fn() } }));

const post = vi.mocked(api.post);

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function TestSetup({ initialEntry, state }: { initialEntry: string; state?: { userId: string } }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return (
    <QueryClientProvider client={client}>
      <Toaster />
      <MemoryRouter
        initialEntries={[
          {
            pathname: initialEntry.split('?')[0],
            search: initialEntry.split('?')[1] ? `?${initialEntry.split('?')[1]}` : '',
            state,
          },
        ]}
      >
        <Routes>
          <Route path="*" element={<VerifyContactPage />} />
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

afterEach(() => {
  vi.useRealTimers();
});

vi.mock('sonner', async (orig) => ({
  ...(await orig<typeof import('sonner')>()),
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('VerifyContactPage', () => {
  it('userId from route state', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: {} });
    render(<TestSetup initialEntry="/verify-contact" state={{ userId: 'u1' }} />);

    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /^verify$/i }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/auth/verify-contact', { userId: 'u1', code: '123456' })
    );
  });

  it('userId from query param', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: {} });
    render(<TestSetup initialEntry="/verify-contact?userId=u2" />);

    await user.type(screen.getByLabelText(/verification code/i), '654321');
    await user.click(screen.getByRole('button', { name: /^verify$/i }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/auth/verify-contact', { userId: 'u2', code: '654321' })
    );
  });

  it('400 error sets field error', async () => {
    const user = userEvent.setup();
    post.mockRejectedValue(httpError(400));
    render(<TestSetup initialEntry="/verify-contact" state={{ userId: 'u1' }} />);

    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /^verify$/i }));

    expect(await screen.findByText('Invalid or expired code')).toBeInTheDocument();
  });

  it('navigate to login on success', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: {} });
    render(<TestSetup initialEntry="/verify-contact" state={{ userId: 'u1' }} />);

    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /^verify$/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(ROUTES.LOGIN);
    });
    expect(toast.success).toHaveBeenCalledWith('Contact verified successfully');
  });

  it('resend button disabled for 30s', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    post.mockResolvedValue({ data: {} });
    render(<TestSetup initialEntry={ROUTES.VERIFY_CONTACT} state={{ userId: 'u1' }} />);

    fireEvent.click(screen.getByRole('button', { name: /resend code/i }));
    expect(screen.getByRole('button', { name: /wait 30s to resend/i })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(29_999);
    });
    expect(post).toHaveBeenCalledWith('/auth/resend-verification', { userId: 'u1' });
    expect(screen.getByRole('button', { name: /wait 30s to resend/i })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByRole('button', { name: /resend code/i })).not.toBeDisabled();
  });

  it('shows missing user id message', () => {
    render(<TestSetup initialEntry="/verify-contact" />);
    expect(screen.getByText('User ID is missing.')).toBeInTheDocument();
  });
});
