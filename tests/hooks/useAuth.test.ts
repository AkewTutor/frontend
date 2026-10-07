import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import type { AuthUser } from '@/types';
import {
  useRegister,
  useLogin,
  useLogout,
  useLogoutAll,
  useVerifyContact,
  useResendVerification,
  useForgotPassword,
  useResetPassword,
} from '@/hooks/useAuth';

vi.mock('@/lib/axios', () => ({ default: { post: vi.fn() } }));

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

const post = vi.mocked(api.post);

// Fixture shape is irrelevant to these hooks (they only hand `user` to the store).
const user = { id: 'u1', role: 'PARENT' } as unknown as AuthUser;

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

function httpError(status: number, message: string) {
  return new AxiosError(message, 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: {} as never,
    data: { message },
  });
}

const session = () => {
  const s = useAuthStore.getState();
  return [s.token, s.refreshToken, s.user];
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ token: null, refreshToken: null, user: null });
});

describe('useLogin', () => {
  it('success calls setAuth with accessToken, refreshToken and user', async () => {
    post.mockResolvedValue({ data: { accessToken: 'a', refreshToken: 'r', user } });
    const { result } = renderHook(() => useLogin(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync({ identifier: 'x@y.z', password: 'pw' }));

    expect(post).toHaveBeenCalledWith('/auth/login', { identifier: 'x@y.z', password: 'pw' });
    expect(session()).toEqual(['a', 'r', user]);
  });

  it('surfaces the identical 401 error for wrong password and unknown identifier', async () => {
    const generic = httpError(401, 'Invalid email/phone or password');
    post.mockRejectedValue(generic);
    const { result } = renderHook(() => useLogin(), { wrapper: wrapper() });

    await act(() =>
      result.current
        .mutateAsync({ identifier: 'known@x.z', password: 'bad' })
        .catch(() => undefined)
    );
    await waitFor(() => expect(result.current.error).toBe(generic));
    const first = result.current.error;

    await act(() =>
      result.current
        .mutateAsync({ identifier: 'nobody@x.z', password: 'bad' })
        .catch(() => undefined)
    );
    await waitFor(() => expect(result.current.error).toBe(generic));
    const second = result.current.error;

    expect(first?.message).toBe(second?.message);
    expect(session()).toEqual([null, null, null]);
  });
});

describe('useLogout', () => {
  it('posts the refreshToken and clears the local session', async () => {
    useAuthStore.setState({ token: 'a', refreshToken: 'r', user });
    post.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useLogout(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync());

    expect(post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'r' });
    await waitFor(() => expect(session()).toEqual([null, null, null]));
  });

  it('still clears the local session when the API call fails', async () => {
    useAuthStore.setState({ token: 'a', refreshToken: 'r', user });
    post.mockRejectedValue(httpError(401, 'expired'));
    const { result } = renderHook(() => useLogout(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync().catch(() => undefined));

    await waitFor(() => expect(session()).toEqual([null, null, null]));
  });

  it('does not navigate from inside the hook', async () => {
    useAuthStore.setState({ token: 'a', refreshToken: 'r', user });
    post.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useLogout(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync());

    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('useLogoutAll', () => {
  it('calls POST /auth/logout-all once with no body', async () => {
    useAuthStore.setState({ token: 'a', refreshToken: 'r', user });
    post.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useLogoutAll(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync());

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/auth/logout-all');
  });

  it('success clears token, refreshToken and user', async () => {
    useAuthStore.setState({ token: 'a', refreshToken: 'r', user });
    post.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useLogoutAll(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync());

    await waitFor(() => expect(session()).toEqual([null, null, null]));
  });

  it('a failed call KEEPS the local session and exposes the error', async () => {
    useAuthStore.setState({ token: 'a', refreshToken: 'r', user });
    const err = httpError(500, 'boom');
    post.mockRejectedValue(err);
    const { result } = renderHook(() => useLogoutAll(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync().catch(() => undefined));

    expect(session()).toEqual(['a', 'r', user]);
    await waitFor(() => expect(result.current.error).toBe(err));
  });

  it('does not navigate from inside the hook', async () => {
    post.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useLogoutAll(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync());

    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('useRegister', () => {
  it.each(['student', 'parent', 'tutor'] as const)(
    'mode=%s posts to its own endpoint',
    async (mode) => {
      post.mockResolvedValue({
        data: { userId: 'u1', role: 'STUDENT', verificationRequired: true },
      });
      const { result } = renderHook(() => useRegister(mode), { wrapper: wrapper() });
      const body = mode === 'student' ? { name: 'n', grade: 8 } : { name: 'n' };

      const res = await act(() => result.current.mutateAsync(body));

      expect(post).toHaveBeenCalledWith(`/auth/register/${mode}`, body);
      expect(res).toEqual({ userId: 'u1', role: 'STUDENT', verificationRequired: true });
    }
  );

  it('exposes a 409 distinctly from a 400', async () => {
    const { result } = renderHook(() => useRegister('parent'), { wrapper: wrapper() });

    post.mockRejectedValueOnce(httpError(409, 'exists'));
    await act(() => result.current.mutateAsync({}).catch(() => undefined));
    await waitFor(() => expect(result.current.error?.response?.status).toBe(409));

    post.mockRejectedValueOnce(httpError(400, 'invalid'));
    await act(() => result.current.mutateAsync({}).catch(() => undefined));
    await waitFor(() => expect(result.current.error?.response?.status).toBe(400));
  });
});

describe('useVerifyContact / useResendVerification', () => {
  it('verify posts { userId, code } and resolves', async () => {
    post.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useVerifyContact(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync({ userId: 'u1', code: '123456' }));

    expect(post).toHaveBeenCalledWith('/auth/verify-contact', { userId: 'u1', code: '123456' });
  });

  it.each([400, 410])('verify propagates a %i error', async (status) => {
    post.mockRejectedValue(httpError(status, 'bad code'));
    const { result } = renderHook(() => useVerifyContact(), { wrapper: wrapper() });

    await act(() =>
      result.current.mutateAsync({ userId: 'u1', code: '000000' }).catch(() => undefined)
    );

    await waitFor(() => expect(result.current.error?.response?.status).toBe(status));
  });

  it('resend does not throttle: two immediate calls both fire', async () => {
    post.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useResendVerification(), { wrapper: wrapper() });

    await act(async () => {
      await result.current.mutateAsync('u1');
      await result.current.mutateAsync('u1');
    });

    expect(post).toHaveBeenCalledTimes(2);
    expect(post).toHaveBeenCalledWith('/auth/resend-verification', { userId: 'u1' });
  });
});

describe('useForgotPassword / useResetPassword', () => {
  it('forgot-password resolves identically for a real and a fake identifier', async () => {
    post.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useForgotPassword(), { wrapper: wrapper() });

    const real = await act(() => result.current.mutateAsync('real@x.z'));
    const fake = await act(() => result.current.mutateAsync('fake@x.z'));

    expect(real).toEqual(fake);
    expect(post).toHaveBeenNthCalledWith(1, '/auth/forgot-password', { identifier: 'real@x.z' });
    expect(post).toHaveBeenNthCalledWith(2, '/auth/forgot-password', { identifier: 'fake@x.z' });
  });

  it('reset-password posts the body and propagates an invalid/expired code error', async () => {
    const body = { identifier: 'me@x.z', code: '000000', newPassword: 'newpassword1' };
    post.mockRejectedValue(httpError(410, 'expired'));
    const { result } = renderHook(() => useResetPassword(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync(body).catch(() => undefined));

    expect(post).toHaveBeenCalledWith('/auth/reset-password', body);
    await waitFor(() => expect(result.current.error?.response?.status).toBe(410));
  });
});
