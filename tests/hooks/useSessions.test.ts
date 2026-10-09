import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import {
  useUpcomingSessions,
  useSession,
  useProvideLink,
  useMarkCompleted,
} from '@/hooks/useSessions';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useUpcomingSessions', () => {
  it('calls GET /sessions with params and returns body', async () => {
    const mockData = { sessions: [], page: 1, limit: 10, total: 0 };
    get.mockResolvedValue({ data: mockData });
    const params = { page: 1, limit: 10 };

    const { result } = renderHook(() => useUpcomingSessions(params), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/sessions', { params });
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useSession', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the right path', async () => {
    get.mockResolvedValue({ data: { id: 's1' } });
    const { result } = renderHook(() => useSession('s1'), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/sessions/s1');
  });

  it('Polls at 15s', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    get.mockResolvedValue({ data: { id: 's1' } });

    renderHook(() => useSession('s1'), { wrapper: wrapper() });

    await vi.advanceTimersByTimeAsync(15_000);

    expect(get).toHaveBeenCalledTimes(2);
  });

  it('enabled: false with no sessionId', async () => {
    renderHook(() => useSession(undefined as unknown as string), { wrapper: wrapper() });
    expect(get).not.toHaveBeenCalled();
  });
});

describe('useProvideLink', () => {
  it('posts jitsiLinkUrl and invalidates both keys', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');
    post.mockResolvedValue({ data: { id: 's1', jitsiLinkUrl: 'https://jitsi/url' } });
    const { result } = renderHook(() => useProvideLink(), { wrapper: wrapper() });

    await act(() =>
      result.current.mutateAsync({ sessionId: 's1', jitsiLinkUrl: 'https://jitsi/url' })
    );

    expect(post).toHaveBeenCalledWith('/sessions/s1/link', { jitsiLinkUrl: 'https://jitsi/url' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.SESSION_DETAIL, 's1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.SESSIONS] });
  });
});

describe('useMarkCompleted', () => {
  it('posts and invalidates both keys', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');
    post.mockResolvedValue({ data: { id: 's1', status: 'COMPLETED' } });
    const { result } = renderHook(() => useMarkCompleted(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync({ sessionId: 's1' }));

    expect(post).toHaveBeenCalledWith('/sessions/s1/complete');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.SESSION_DETAIL, 's1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.SESSIONS] });
  });
});
