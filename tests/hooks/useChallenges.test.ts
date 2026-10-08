import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import {
  useActiveChallenges,
  useCreateChallenge,
  useMyChallengeProgress,
} from '@/hooks/useChallenges';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const mockedApi = vi.mocked(api);

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(qc, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { qc, invalidate, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useActiveChallenges', () => {
  it('GETs /gamification/challenges under [CHALLENGES]', async () => {
    mockedApi.get.mockResolvedValue({ data: { challenges: [] } });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useActiveChallenges(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/gamification/challenges');
    expect(qc.getQueryData([QUERY_KEYS.CHALLENGES])).toEqual({ challenges: [] });
  });
});

describe('useMyChallengeProgress', () => {
  it('sends studentId and keys by it', async () => {
    mockedApi.get.mockResolvedValue({ data: { progress: [] } });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useMyChallengeProgress('s1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/gamification/challenges/me', {
      params: { studentId: 's1' },
    });
    expect(qc.getQueryData([QUERY_KEYS.CHALLENGE_PROGRESS, 's1'])).toEqual({ progress: [] });
  });
});

describe('useCreateChallenge', () => {
  it('POSTs the body and invalidates [CHALLENGES]', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 'c1' } });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useCreateChallenge(), { wrapper });
    const body = {
      title: 'Three assessments',
      description: 'Complete 3 this week',
      period: 'WEEKLY' as const,
      startsAt: '2026-10-12T00:00:00.000Z',
      endsAt: '2026-10-19T00:00:00.000Z',
      targetValue: 3,
    };
    await act(async () => {
      await result.current.mutateAsync(body);
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/challenges', body);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.CHALLENGES] });
  });
});
