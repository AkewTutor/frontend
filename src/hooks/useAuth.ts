import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { ROUTES } from '@/constants';
import { useAuthStore } from '@/store/auth.store';
import type { LoginCredentials, LoginResponse, RegisterResponse } from '@/types';

export type RegisterRole = 'student' | 'parent' | 'tutor';

/** POST /auth/register/:role. `role` is a hook parameter, one instance per page mount. */
export function useRegister(role: RegisterRole) {
  return useMutation<RegisterResponse, AxiosError, Record<string, unknown>>({
    mutationFn: (body) =>
      api.post<RegisterResponse>(`/auth/register/${role}`, body).then((r) => r.data),
  });
}

/** POST /auth/login. A 401 is a genuine mutation error (generic message, never field-specific). */
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation<LoginResponse, AxiosError, { identifier: string; password: string }>({
    mutationFn: (creds) => api.post<LoginResponse>('/auth/login', creds).then((r) => r.data),
    onSuccess: (data) => setAuth(data.accessToken, data.refreshToken, data.user),
  });
}

/**
 * POST /auth/logout (body: refreshToken, per 06-api/01). Local state clears in `onSettled`,
 * so a failed call (expired token, network) never leaves the person stuck signed in.
 * No navigate(): ProtectedRoute redirects when `token` becomes null.
 */
export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation<void, AxiosError, void>({
    mutationFn: () =>
      api
        .post('/auth/logout', { refreshToken: useAuthStore.getState().refreshToken })
        .then(() => undefined),
    onSettled: () => logout(),
  });
}

/**
 * POST /auth/logout-all (no body). Deliberately `onSuccess`, NOT `onSettled`: on failure other
 * devices are still signed in, so keep this session and surface the error.
 */
export function useLogoutAll() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation<unknown, AxiosError, void>({
    mutationFn: () => api.post('/auth/logout-all').then((r) => r.data),
    onSuccess: () => logout(),
  });
}

export function useVerifyContact() {
  return useMutation<unknown, AxiosError, { userId: string; code: string }>({
    mutationFn: (body) => api.post('/auth/verify-contact', body).then((r) => r.data),
  });
}

/** No client-side throttle here; the 30s UI disable lives in VerifyContactPage, the real limit is server-side. */
export function useResendVerification() {
  return useMutation<unknown, AxiosError, string>({
    mutationFn: (userId) => api.post('/auth/resend-verification', { userId }).then((r) => r.data),
  });
}

/** Success and "no account found" resolve identically (API non-disclosure); no branching here. */
export function useForgotPassword() {
  return useMutation<unknown, AxiosError, string>({
    mutationFn: (identifier) =>
      api.post('/auth/forgot-password', { identifier }).then((r) => r.data),
  });
}

export function useResetPassword() {
  return useMutation<
    unknown,
    AxiosError,
    { identifier: string; code: string; newPassword: string }
  >({
    mutationFn: (body) => api.post('/auth/reset-password', body).then((r) => r.data),
  });
}

/**
 * @deprecated Template-era hook kept only until LoginPage (P1.5) and Dev B's DashboardLayout
 * stop using it. Use useLogin / useLogout instead. Remove once both are migrated.
 */
export function useAuth() {
  const { token, user, setAuth, logout: clearSession } = useAuthStore();
  const navigate = useNavigate();

  const login = async (credentials: LoginCredentials) => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    setAuth(data.accessToken, data.refreshToken, data.user);
    navigate(ROUTES.HOME);
  };

  const logout = () => {
    clearSession();
    navigate(ROUTES.LOGIN);
  };

  return { user, token, isAuthenticated: !!token, login, logout };
}
