import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import {
  useApprovalQueue,
  useApproveCohort,
  useManualAssign,
  useRejectCohort,
} from '@/hooks/useAdminMatching';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const mockedApi = vi.mocked(api);
const queuePayload = { queue: [], page: 1, limit: 20, total: 0 };

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

describe('useApprovalQueue', () => {
  it('requests the given page with limit 20 and returns the payload', async () => {
    mockedApi.get.mockResolvedValue({ data: queuePayload });
    const { wrapper } = setup();

    const { result } = renderHook(() => useApprovalQueue(2), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/matching/queue', {
      params: { page: 2, limit: 20 },
    });
    expect(result.current.data).toEqual(queuePayload);
  });

  it('defaults to page 1', async () => {
    mockedApi.get.mockResolvedValue({ data: queuePayload });
    const { wrapper } = setup();
    renderHook(() => useApprovalQueue(), { wrapper });
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/matching/queue', {
      params: { page: 1, limit: 20 },
    });
  });

  it('polls at 20s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockedApi.get.mockResolvedValue({ data: queuePayload });
    const { wrapper } = setup();

    renderHook(() => useApprovalQueue(), { wrapper });
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(20_000);

    await waitFor(() => expect(mockedApi.get.mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});

describe('queue mutations', () => {
  it('useApproveCohort posts to the approve endpoint and invalidates the queue', async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    const { qc, wrapper } = setup();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useApproveCohort(), { wrapper });
    result.current.mutate('c1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/matching/c1/approve');
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.MATCHING_QUEUE] });
  });

  it('useRejectCohort posts the reason and invalidates the queue', async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    const { qc, wrapper } = setup();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useRejectCohort(), { wrapper });
    result.current.mutate({ cohortId: 'c1', reason: 'Tutor unavailable' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/matching/c1/reject', {
      reason: 'Tutor unavailable',
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.MATCHING_QUEUE] });
  });

  it('useManualAssign posts the tutor/student/format triple and invalidates the queue', async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    const { qc, wrapper } = setup();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const body = { tutorId: 't1', studentIds: ['s1', 's2'], format: 'ONE_TO_THREE' as const };

    const { result } = renderHook(() => useManualAssign(), { wrapper });
    result.current.mutate(body);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/matching/manual-assign', body);
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.MATCHING_QUEUE] });
  });

  it('does not invalidate the queue when a mutation fails', async () => {
    mockedApi.post.mockRejectedValue(new Error('boom'));
    const { qc, wrapper } = setup();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useApproveCohort(), { wrapper });
    result.current.mutate('c1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(spy).not.toHaveBeenCalled();
  });
});
