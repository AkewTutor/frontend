import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { useCohortMembers, useMyCohorts } from '@/hooks/useCohort';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn() } }));

const mockedApi = vi.mocked(api);

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useMyCohorts', () => {
  it('requests /cohorts/me with the studentId param and returns the payload', async () => {
    const payload = { cohorts: [] };
    mockedApi.get.mockResolvedValue({ data: payload });
    const { wrapper } = setup();

    const { result } = renderHook(() => useMyCohorts('s1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/cohorts/me', { params: { studentId: 's1' } });
    expect(result.current.data).toEqual(payload);
  });

  it('works without a studentId', async () => {
    mockedApi.get.mockResolvedValue({ data: { cohorts: [] } });
    const { wrapper } = setup();

    renderHook(() => useMyCohorts(), { wrapper });

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));
    expect(mockedApi.get).toHaveBeenCalledWith('/cohorts/me', {
      params: { studentId: undefined },
    });
  });

  it('polls at 30s (job-driven status changes have no client trigger)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockedApi.get.mockResolvedValue({ data: { cohorts: [] } });
    const { wrapper } = setup();

    renderHook(() => useMyCohorts('s1'), { wrapper });
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(30_000);

    await waitFor(() => expect(mockedApi.get.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('exposes an error state when the request fails', async () => {
    mockedApi.get.mockRejectedValue(new Error('boom'));
    const { wrapper } = setup();

    const { result } = renderHook(() => useMyCohorts(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCohortMembers', () => {
  it('requests the members of the given cohort and returns the payload', async () => {
    const payload = {
      members: [{ id: 'u1', role: 'STUDENT', displayName: 'Sam', profilePictureUrl: null }],
    };
    mockedApi.get.mockResolvedValue({ data: payload });
    const { wrapper } = setup();

    const { result } = renderHook(() => useCohortMembers('c1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/cohorts/c1/members');
    expect(result.current.data).toEqual(payload);
  });

  it('does not fetch while cohortId is empty', async () => {
    const { wrapper } = setup();

    const { result } = renderHook(() => useCohortMembers(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});
