import { renderHook, waitFor } from '@testing-library/react';
import { useSessionMisses, useRecordSessionMiss } from '@/hooks/useSessionMiss';
import api from '@/lib/axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('useSessionMisses', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  it('GETs /session-miss with params and returns data', async () => {
    const mockResponse = { misses: [], page: 1, limit: 20, total: 0 };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useSessionMisses({ page: 1, limit: 20 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/session-miss', { params: { page: 1, limit: 20 } });
    expect(result.current.data).toEqual(mockResponse);
  });
});

describe('useRecordSessionMiss', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  it('POSTs /session-miss with variables and invalidates SESSION_MISSES, SESSIONS, SESSION_DETAIL on success', async () => {
    const mockResponse = { sessionId: 's1', causedBy: 'STUDENT', makeupDeadline: null };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRecordSessionMiss(), { wrapper });
    result.current.mutate({
      sessionId: 's1',
      causedBy: 'STUDENT',
      missType: 'NO_SHOW',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.post).toHaveBeenCalledWith('/session-miss', {
      sessionId: 's1',
      causedBy: 'STUDENT',
      missType: 'NO_SHOW',
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['session-misses'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['sessions'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['session-detail', 's1'] });
  });

  it('mutates error.message to match server message on error without throwing', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { data: { message: 'Already recorded' } },
    });

    const { result } = renderHook(() => useRecordSessionMiss(), { wrapper });
    result.current.mutate({
      sessionId: 's1',
      causedBy: 'STUDENT',
      missType: 'NO_SHOW',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Already recorded');
  });
});

describe('useSessionMiss spec rows (9-4 s9.6a)', () => {
  const setup = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    return { queryClient, wrapper };
  };

  beforeEach(() => vi.clearAllMocks());

  it('different params create different cache entries', async () => {
    const { queryClient, wrapper } = setup();
    vi.mocked(api.get).mockResolvedValue({ data: { misses: [], page: 1, limit: 20, total: 0 } });
    const a = renderHook(
      () => useSessionMisses({ tutorId: 't1', causedBy: 'TUTOR', page: 1, limit: 20 }),
      { wrapper }
    );
    await waitFor(() => expect(a.result.current.isSuccess).toBe(true));
    const b = renderHook(() => useSessionMisses({ tutorId: 't2', page: 1, limit: 20 }), {
      wrapper,
    });
    await waitFor(() => expect(b.result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryCache().findAll({ queryKey: ['session-misses'] })).toHaveLength(2);
  });

  it('409 invalidates no query and surfaces the server message unchanged', async () => {
    const { queryClient, wrapper } = setup();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    const msg = 'A miss has already been recorded for this session';
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { status: 409, data: { message: msg } },
    });
    const { result } = renderHook(() => useRecordSessionMiss(), { wrapper });
    result.current.mutate({ sessionId: 's1', causedBy: 'STUDENT', missType: 'NO_SHOW' });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(spy).not.toHaveBeenCalled();
    expect(result.current.error?.message).toBe(msg);
  });
});
