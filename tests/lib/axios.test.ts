import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import type { AuthUser } from '@/types';

vi.mock('@/config/env', () => ({ env: { VITE_API_URL: 'http://api.test' } }));

// Fixture shape is irrelevant to the interceptor (it only re-passes the user to setAuth).
const user = { id: 'u1', role: 'STUDENT' } as unknown as AuthUser;

const ok = (config: InternalAxiosRequestConfig, data: unknown) =>
  Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });

const fail = (config: InternalAxiosRequestConfig, status: number) =>
  Promise.reject(
    new AxiosError('fail', 'ERR_BAD_REQUEST', config, undefined, {
      status,
      statusText: '',
      headers: {},
      config,
      data: {},
    })
  );

const originalLocation = window.location;
let seen: InternalAxiosRequestConfig[];
let postSpy: ReturnType<typeof vi.spyOn>;

function setLocation(pathname: string, search = '') {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { pathname, search, href: '' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  seen = [];
  useAuthStore.setState({ token: null, refreshToken: null, user: null });
  setLocation('/tutor/earnings');
  postSpy = vi.spyOn(axios, 'post');
});

afterEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: originalLocation,
  });
  postSpy.mockRestore();
});

describe('request interceptor', () => {
  it('attaches the Bearer token when present', async () => {
    useAuthStore.setState({ token: 'tok' });
    api.defaults.adapter = (c) => (seen.push(c), ok(c, { data: 1 }));
    await api.get('/x');
    expect(seen[0].headers.Authorization).toBe('Bearer tok');
  });

  it('omits the header when there is no token', async () => {
    api.defaults.adapter = (c) => (seen.push(c), ok(c, { data: 1 }));
    await api.post('/auth/login', {});
    expect(seen[0].headers.Authorization).toBeUndefined();
  });
});

describe('response interceptor', () => {
  it('unwraps the success envelope', async () => {
    api.defaults.adapter = (c) => ok(c, { statusCode: 200, success: true, data: { a: 1 } });
    const res = await api.get('/x');
    expect(res.data).toEqual({ a: 1 });
  });

  it.each([400, 403, 500])('passes %i through without logging out', async (status) => {
    useAuthStore.setState({ token: 't', refreshToken: 'r', user });
    api.defaults.adapter = (c) => fail(c, status);
    await expect(api.get('/x')).rejects.toBeTruthy();
    expect(useAuthStore.getState().token).toBe('t');
    expect(window.location.href).toBe('');
  });

  it('passes a 401 from /auth/login through (no refresh, no redirect)', async () => {
    useAuthStore.setState({ token: 't', refreshToken: 'r', user });
    api.defaults.adapter = (c) => fail(c, 401);
    await expect(api.post('/auth/login', {})).rejects.toBeTruthy();
    expect(postSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBe('t');
    expect(window.location.href).toBe('');
  });
});

describe('401 refresh flow', () => {
  const protectedAdapter = (c: InternalAxiosRequestConfig) => {
    seen.push(c);
    return c.headers.Authorization === 'Bearer new-access'
      ? ok(c, { data: { ok: true } })
      : fail(c, 401);
  };

  it('refreshes once, stores the new pair with the existing user, and retries', async () => {
    useAuthStore.setState({ token: 'old', refreshToken: 'r1', user });
    api.defaults.adapter = protectedAdapter;
    postSpy.mockResolvedValue({
      data: { data: { accessToken: 'new-access', refreshToken: 'r2' } },
    });

    const res = await api.get('/secure');

    expect(res.data).toEqual({ ok: true });
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy.mock.calls[0][0]).toBe('http://api.test/auth/refresh');
    expect(postSpy.mock.calls[0][1]).toEqual({ refreshToken: 'r1' });
    const s = useAuthStore.getState();
    expect(s.token).toBe('new-access');
    expect(s.refreshToken).toBe('r2');
    expect(s.user).toBe(user);
    expect(window.location.href).toBe('');
  });

  it('concurrent 401s trigger a single refresh call', async () => {
    useAuthStore.setState({ token: 'old', refreshToken: 'r1', user });
    api.defaults.adapter = protectedAdapter;
    postSpy.mockResolvedValue({
      data: { data: { accessToken: 'new-access', refreshToken: 'r2' } },
    });

    const [a, b] = await Promise.all([api.get('/a'), api.get('/b')]);

    expect(a.data).toEqual({ ok: true });
    expect(b.data).toEqual({ ok: true });
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('when refresh fails: logs out and redirects with returnTo', async () => {
    useAuthStore.setState({ token: 'old', refreshToken: 'r1', user });
    api.defaults.adapter = (c) => fail(c, 401);
    postSpy.mockRejectedValue(new Error('refresh failed'));

    await expect(api.get('/secure')).rejects.toBeTruthy();

    const s = useAuthStore.getState();
    expect([s.token, s.refreshToken, s.user]).toEqual([null, null, null]);
    expect(window.location.href).toBe('/login?returnTo=%2Ftutor%2Fearnings');
  });

  it('with no stored refreshToken: logs out and redirects without calling refresh', async () => {
    useAuthStore.setState({ token: 'old', refreshToken: null, user });
    api.defaults.adapter = (c) => fail(c, 401);

    await expect(api.get('/secure')).rejects.toBeTruthy();

    expect(postSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBeNull();
    expect(window.location.href).toBe('/login?returnTo=%2Ftutor%2Fearnings');
  });

  it('returnTo is the encoded relative pathname+search only (open-redirect guard)', async () => {
    setLocation('/tutor/earnings', '?x=https://evil.example');
    api.defaults.adapter = (c) => fail(c, 401);

    await expect(api.get('/secure')).rejects.toBeTruthy();

    expect(window.location.href).toBe(
      `/login?returnTo=${encodeURIComponent('/tutor/earnings?x=https://evil.example')}`
    );
    expect(window.location.href.startsWith('/login?returnTo=%2F')).toBe(true);
  });

  it('does not redirect when already on /login', async () => {
    setLocation('/login');
    api.defaults.adapter = (c) => fail(c, 401);

    await expect(api.get('/secure')).rejects.toBeTruthy();

    expect(window.location.href).toBe('');
  });

  it('a 401 after a successful refresh ends the session (no retry loop)', async () => {
    useAuthStore.setState({ token: 'old', refreshToken: 'r1', user });
    api.defaults.adapter = (c) => fail(c, 401);
    postSpy.mockResolvedValue({
      data: { data: { accessToken: 'new-access', refreshToken: 'r2' } },
    });

    await expect(api.get('/secure')).rejects.toBeTruthy();

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().token).toBeNull();
    expect(window.location.href).toBe('/login?returnTo=%2Ftutor%2Fearnings');
  });
});
