import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QUERY_KEYS } from '@/constants';
import { useMessages, useSendMessage, useThread } from '@/hooks/useMessaging';
import api from '@/lib/axios';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const mockedApi = vi.mocked(api);

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { qc, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useThread', () => {
  it('requests the thread for the cohort and returns the payload', async () => {
    const payload = {
      id: 'th1',
      cohortId: 'c1',
      format: 'ONE_TO_ONE',
      status: 'ACTIVE',
      participantCount: 2,
    };
    mockedApi.get.mockResolvedValue({ data: payload });
    const { wrapper } = setup();

    const { result } = renderHook(() => useThread('c1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/messaging/cohorts/c1/thread');
    expect(result.current.data).toEqual(payload);
  });

  it('does not fire without a cohortId', () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useThread(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

describe('useMessages', () => {
  it('requests page 1 with limit 50 and returns the payload', async () => {
    const payload = { messages: [], page: 1, limit: 50, total: 0 };
    mockedApi.get.mockResolvedValue({ data: payload });
    const { wrapper } = setup();

    const { result } = renderHook(() => useMessages('c1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/messaging/cohorts/c1/messages', {
      params: { page: 1, limit: 50 },
    });
    expect(result.current.data).toEqual(payload);
  });

  it('does not fire without a cohortId', () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useMessages(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  // Polls because V1 has no websocket (NOT a job-driven state like useMyCohorts in 9-3).
  it('polls at 8s unconditionally (no websocket in V1)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockedApi.get.mockResolvedValue({ data: { messages: [], page: 1, limit: 50, total: 0 } });
    const { wrapper } = setup();

    renderHook(() => useMessages('c1'), { wrapper });
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(8_000);

    await waitFor(() => expect(mockedApi.get.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('stops polling after a 403 (thread not available)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockedApi.get.mockRejectedValue({ response: { status: 403 } });
    const { wrapper } = setup();

    const { result } = renderHook(() => useMessages('c1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(24_000);

    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });
});

describe('useSendMessage', () => {
  it('posts the body and invalidates the messages key without touching the cache', async () => {
    mockedApi.post.mockResolvedValue({
      data: { id: 'm1', senderId: 'u1', body: 'hi', createdAt: 'x' },
    });
    const { qc, wrapper } = setup();
    const invalidate = vi.spyOn(qc, 'invalidateQueries');
    const setData = vi.spyOn(qc, 'setQueryData');

    const { result } = renderHook(() => useSendMessage('c1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('hi');
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/messaging/cohorts/c1/messages', { body: 'hi' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.MESSAGES, 'c1'] });
    expect(setData).not.toHaveBeenCalled();
  });

  it('lets a 403 propagate untouched so the composer can distinguish the cases', async () => {
    const error = {
      response: { status: 403, data: { message: 'This conversation has been closed' } },
    };
    mockedApi.post.mockRejectedValue(error);
    const { wrapper } = setup();

    const { result } = renderHook(() => useSendMessage('c1'), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync('hi')).rejects.toBe(error);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });
});
