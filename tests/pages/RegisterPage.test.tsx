import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import RegisterPage from '@/pages/RegisterPage';
import { ROUTES } from '@/constants';
import api from '@/lib/axios';
import { type RegisterRole } from '@/hooks/useAuth';

vi.mock('@/lib/axios', () => ({ default: { post: vi.fn() } }));

const post = vi.mocked(api.post);

function LocationDisplay() {
  const location = useLocation();
  return (
    <div data-testid="location">
      {location.pathname}
      {location.state?.userId ? `?userId=${location.state.userId}` : ''}
    </div>
  );
}

function TestSetup({ initialEntry, mode }: { initialEntry: string; mode?: RegisterRole }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="*" element={<RegisterPage mode={mode} />} />
          <Route path={ROUTES.LOGIN} element={<LocationDisplay />} />
          <Route path={ROUTES.VERIFY_CONTACT} element={<LocationDisplay />} />
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

describe('RegisterPage', () => {
  it.each([['student'], ['parent'], ['tutor']])(
    'parameterized over mode: %s uses correct role API',
    async (role) => {
      const user = userEvent.setup();
      post.mockResolvedValue({ data: { verificationRequired: false } });
      render(<TestSetup initialEntry={`/register/${role}`} mode={role as RegisterRole} />);

      await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
      await user.type(screen.getByLabelText(/password/i), 'secret123');
      await user.click(screen.getByLabelText(/accept terms/i));

      if (role === 'student') {
        await user.type(screen.getByLabelText(/grade/i), '10');
      }

      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(post).toHaveBeenCalledWith(`/auth/register/${role}`, expect.any(Object));
      });
    }
  );

  it('grade=3 blocked client-side', async () => {
    const user = userEvent.setup();
    render(<TestSetup initialEntry="/register/student" mode="student" />);

    await user.type(screen.getByLabelText(/grade/i), '3');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(post).not.toHaveBeenCalled();
    expect(await screen.findByText('Grade must be between 6 and 12')).toBeInTheDocument();
  });

  it('termsAccepted false blocked all modes', async () => {
    const user = userEvent.setup();
    render(<TestSetup initialEntry="/register/parent" mode="parent" />);

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    // Not clicking accept terms
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(post).not.toHaveBeenCalled();
    expect(await screen.findByText('You must accept the terms')).toBeInTheDocument();
  });

  it('mode prop wins over pathname', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: { verificationRequired: false } });
    render(<TestSetup initialEntry="/register/student" mode="parent" />);

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByLabelText(/accept terms/i));

    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/auth/register/parent', expect.any(Object));
    });
  });

  it('pathname alone selects mode', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: { verificationRequired: false } });
    render(<TestSetup initialEntry="/register/tutor" />);

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByLabelText(/accept terms/i));

    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/auth/register/tutor', expect.any(Object));
    });
  });

  it('409 error -> field-level error on identifier', async () => {
    const user = userEvent.setup();
    post.mockRejectedValue(httpError(409));
    render(<TestSetup initialEntry="/register/parent" mode="parent" />);

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByLabelText(/accept terms/i));

    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('This identifier is already in use')).toBeInTheDocument();
  });

  it('navigates to login on success if verification not required', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: { verificationRequired: false, userId: 'u1' } });
    render(<TestSetup initialEntry="/register/parent" mode="parent" />);

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByLabelText(/accept terms/i));

    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(ROUTES.LOGIN);
    });
  });

  it('navigates to verify contact on success if verification required', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: { verificationRequired: true, userId: 'u2' } });
    render(<TestSetup initialEntry="/register/parent" mode="parent" />);

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByLabelText(/accept terms/i));

    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        `${ROUTES.VERIFY_CONTACT}?userId=u2`
      );
    });
  });
});
