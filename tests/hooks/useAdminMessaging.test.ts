import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QUERY_KEYS } from '@/constants';
import { useCloseThread, useReviewThread } from '@/hooks/useAdminMessaging';
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

describe('useReviewThread', () => {
  it('requests the thread with page and limit and returns the payload', async () => {
    const payload = {
      id: 'th1',
      cohortId: 'c1',
      status: 'ACTIVE',
      messages: [],
      page: 2,
      limit: 50,
      total: 0,
    };
    mockedApi.get.mockResolvedValue({ data: payload });
    const { wrapper } = setup();

    const { result } = renderHook(() => useReviewThread('th1', 2), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/messaging/threads/th1', {
      params: { page: 2, limit: 50 },
    });
    expect(result.current.data).toEqual(payload);
  });

  it('does not fire without a threadId', () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useReviewThread(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('exposes a 404 as an error state', async () => {
    mockedApi.get.mockRejectedValue({ response: { status: 404 } });
    const { wrapper } = setup();

    const { result } = renderHook(() => useReviewThread('missing'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.response?.status).toBe(404);
  });
});

describe('useCloseThread', () => {
  it("posts the reason and invalidates only that thread's admin key", async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 'th1', status: 'CLOSED_BY_ADMIN' } });
    const { qc, wrapper } = setup();
    const invalidate = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useCloseThread(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ threadId: 'th1', reason: 'Harassment' });
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/admin/messaging/threads/th1/close', {
      reason: 'Harassment',
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.ADMIN_THREAD, 'th1'] });
  });
});
