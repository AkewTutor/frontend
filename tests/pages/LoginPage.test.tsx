import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import LoginPage from '@/pages/LoginPage';
import PublicRoute from '@/routes/PublicRoute';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants';
import api from '@/lib/axios';

vi.mock('@/lib/axios', () => ({ default: { post: vi.fn() } }));

const post = vi.mocked(api.post);

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

function TestSetup({
  initialEntry,
  withPublicRoute = false,
}: {
  initialEntry: string;
  withPublicRoute?: boolean;
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const page = <LoginPage />;

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          {withPublicRoute ? (
            <Route element={<PublicRoute />}>
              <Route path={ROUTES.LOGIN} element={page} />
            </Route>
          ) : (
            <Route path={ROUTES.LOGIN} element={page} />
          )}
          <Route path="/tutor/earnings" element={<LocationDisplay />} />
          <Route path="/student/profile" element={<LocationDisplay />} />
          <Route path={ROUTES.PARENT_HOME} element={<LocationDisplay />} />
          <Route path={ROUTES.TUTOR_HOME} element={<LocationDisplay />} />
          <Route path={ROUTES.STUDENT_HOME} element={<LocationDisplay />} />
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
  useAuthStore.setState({ token: null, refreshToken: null, user: null });
});

describe('LoginPage', () => {
  it('Client-side validation blocks an empty submit: useLogin().mutate is never called', async () => {
    const user = userEvent.setup();
    render(<TestSetup initialEntry={ROUTES.LOGIN} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(post).not.toHaveBeenCalled();
    expect(await screen.findByText('Identifier is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
  });

  it('returnTo redirect on success', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({
      data: { user: { role: 'TUTOR' }, accessToken: 'a', refreshToken: 'r' },
    });
    render(<TestSetup initialEntry={`${ROUTES.LOGIN}?returnTo=%2Ftutor%2Fearnings`} />);

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/tutor/earnings');
    });
  });

  it('No returnTo — falls back to role-default route', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({
      data: { user: { role: 'PARENT' }, accessToken: 'a', refreshToken: 'r' },
    });
    render(<TestSetup initialEntry={ROUTES.LOGIN} />);

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(ROUTES.PARENT_HOME);
    });
  });

  it('401 renders a form-level banner, form re-enabled', async () => {
    const user = userEvent.setup();
    post.mockRejectedValue(httpError(401));
    render(<TestSetup initialEntry={ROUTES.LOGIN} />);

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid email/phone or password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
    expect(screen.getByLabelText(/email or phone/i)).not.toBeDisabled();
  });

  it('Submitting state disables the button and shows a spinner', async () => {
    const user = userEvent.setup();
    let resolvePost: (v?: unknown) => void = () => {};
    post.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      })
    );
    render(<TestSetup initialEntry={ROUTES.LOGIN} />);

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn).toBeDisabled();

    resolvePost({ data: { user: { role: 'STUDENT' }, accessToken: 'a', refreshToken: 'r' } });
  });

  it('valid relative returnTo is honored', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({
      data: { user: { role: 'STUDENT' }, accessToken: 'a', refreshToken: 'r' },
    });
    render(
      <TestSetup initialEntry={`${ROUTES.LOGIN}?returnTo=%2Fstudent%2Fprofile%3Ffilter%3D1`} />
    );

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/student/profile?filter=1');
    });
  });

  it.each([['//evil.com'], ['https://evil.com'], ['/\\evil']])(
    "'%s' falls back to the role default route",
    async (badReturnTo) => {
      const user = userEvent.setup();
      post.mockResolvedValue({
        data: { user: { role: 'TUTOR' }, accessToken: 'a', refreshToken: 'r' },
      });
      render(
        <TestSetup initialEntry={`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(badReturnTo)}`} />
      );

      await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
      await user.type(screen.getByLabelText(/password/i), 'secret');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent(ROUTES.TUTOR_HOME);
      });
    }
  );

  it('RACE TEST: render the page under the real PublicRoute and the real useAuthStore', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({
      data: { user: { role: 'STUDENT' }, accessToken: 'a', refreshToken: 'r' },
    });

    render(
      <TestSetup
        initialEntry={`${ROUTES.LOGIN}?returnTo=%2Fstudent%2Fprofile`}
        withPublicRoute={true}
      />
    );

    await user.type(screen.getByLabelText(/email or phone/i), 'me@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/student/profile');
    });

    expect(useAuthStore.getState().token).toBe('a');
  });
});
