import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { ROUTES } from '@/constants';
import { useAuthStore } from '@/store/auth.store';
import type { ApiResponse } from '@/types';

const api = axios.create({
  baseURL: env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Public auth endpoints: a 401 here means bad credentials/token, not an expired
// session, so it must never trigger a refresh or a redirect.
const PUBLIC_AUTH_URL =
  /^\/auth\/(login|refresh|register|verify-contact|resend-verification|forgot-password|reset-password)(\/|\?|$)/;

function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as ApiResponse<T>).data;
  }
  return body as T;
}

// Request interceptor — attach the access token on every request when present.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh: the refresh token is single-use/rotating (NFR-015), so
// concurrent 401s must share one POST /auth/refresh.
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const { refreshToken } = useAuthStore.getState();
    // Bare axios (not `api`) so a failing refresh cannot re-enter this interceptor.
    refreshPromise = axios
      .post(
        `${env.VITE_API_URL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      )
      .then((res) => {
        const payload = unwrap<{ accessToken: string; refreshToken: string }>(res.data);
        const { user, setAuth } = useAuthStore.getState();
        if (!user) throw new Error('No session user to refresh');
        setAuth(payload.accessToken, payload.refreshToken, user);
        return payload.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function endSession() {
  useAuthStore.getState().logout();
  const { pathname, search } = window.location;
  if (pathname !== ROUTES.LOGIN) {
    // App-relative path only (open-redirect guard); never a scheme-qualified URL.
    window.location.href = `${ROUTES.LOGIN}?returnTo=${encodeURIComponent(pathname + search)}`;
  }
}

// Response interceptor — unwrap the SuccessResponse envelope once, and handle 401:
// refresh once and retry; if that is impossible, end the session.
api.interceptors.response.use(
  (response) => {
    response.data = unwrap(response.data);
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    if (error.response?.status !== 401 || !original) {
      return Promise.reject(error);
    }
    if (PUBLIC_AUTH_URL.test(original.url ?? '')) {
      return Promise.reject(error);
    }
    if (original._retry || !useAuthStore.getState().refreshToken) {
      endSession();
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      const accessToken = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch {
      endSession();
      return Promise.reject(error);
    }
  }
);

export default api;
