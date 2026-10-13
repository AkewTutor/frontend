import { renderHook, waitFor } from '@testing-library/react';
import { useRequestReschedule } from '@/hooks/useReschedule';
import api from '@/lib/axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/axios', () => ({ default: { post: vi.fn() } }));

describe('useRequestReschedule', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it('POSTs /reschedule with exactly { sessionId, requestedNewStart } (assert key absence of reason)', async () => {
    const mockResponse = {
      id: 'resch-1',
      sessionId: 'sess-1',
      requestedNewStart: '2024-01-02T10:00:00.000Z',
      noticeHours: '24',
      classification: 'FREE_RESCHEDULE' as const,
    };

    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useRequestReschedule(), { wrapper });

    result.current.mutate({
      sessionId: 'sess-1',
      requestedNewStart: '2024-01-02T10:00:00.000Z',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.post).toHaveBeenCalledWith('/reschedule', {
      sessionId: 'sess-1',
      requestedNewStart: '2024-01-02T10:00:00.000Z',
    });

    const callArgs = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs).not.toHaveProperty('reason');
    expect(result.current.data).toEqual(mockResponse);
  });

  it('invalidates [SESSIONS] and [SESSION_DETAIL, sessionId]', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} });
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRequestReschedule(), { wrapper });

    result.current.mutate({
      sessionId: 'sess-1',
      requestedNewStart: '2024-01-02T10:00:00.000Z',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['sessions'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['session-detail', 'sess-1'],
    });
  });

  it('a case where the preview would be FREE_RESCHEDULE but the server resolves SAME_DAY_MISS and the hook result carries the server value', async () => {
    const mockResponse = {
      id: 'resch-1',
      sessionId: 'sess-1',
      requestedNewStart: '2024-01-02T10:00:00.000Z',
      noticeHours: '11.5',
      classification: 'SAME_DAY_MISS' as const,
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useRequestReschedule(), { wrapper });

    result.current.mutate({
      sessionId: 'sess-1',
      requestedNewStart: '2024-01-02T10:00:00.000Z',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.classification).toBe('SAME_DAY_MISS');
  });
});
