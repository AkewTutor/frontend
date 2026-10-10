import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import { useLeaderboard, useMyBadges, useMyProgress } from '@/hooks/useGamification';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn() } }));

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

describe('useMyProgress', () => {
  it('calls /gamification/xp/me with studentId and keys by it', async () => {
    const data = { totalXP: 10, streak: {}, recentEntries: [] };
    mockedApi.get.mockResolvedValue({ data });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useMyProgress('s1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/gamification/xp/me', {
      params: { studentId: 's1' },
    });
    expect(qc.getQueryData([QUERY_KEYS.XP_PROGRESS, 's1'])).toEqual(data);
  });

  it('student call has no studentId', async () => {
    mockedApi.get.mockResolvedValue({ data: { totalXP: 0 } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useMyProgress(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/gamification/xp/me', {
      params: { studentId: undefined },
    });
  });
});

describe('useLeaderboard', () => {
  it('sends period and studentId, key includes both', async () => {
    const data = { grade: 5, period: 'WEEKLY', rankings: [], callerRank: 1 };
    mockedApi.get.mockResolvedValue({ data });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useLeaderboard('WEEKLY', 's1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/gamification/leaderboard', {
      params: { period: 'WEEKLY', studentId: 's1' },
    });
    expect(qc.getQueryData([QUERY_KEYS.LEADERBOARD, 'WEEKLY', 's1'])).toEqual(data);
  });

  it('different period uses a different cache entry', async () => {
    mockedApi.get.mockResolvedValue({ data: { rankings: [] } });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useLeaderboard('MONTHLY'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(qc.getQueryData([QUERY_KEYS.LEADERBOARD, 'MONTHLY', undefined])).toBeDefined();
    expect(qc.getQueryData([QUERY_KEYS.LEADERBOARD, 'WEEKLY', undefined])).toBeUndefined();
  });
});

describe('useMyBadges', () => {
  it('calls /gamification/badges/me with studentId', async () => {
    mockedApi.get.mockResolvedValue({ data: { badges: [] } });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useMyBadges('s1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/gamification/badges/me', {
      params: { studentId: 's1' },
    });
    expect(qc.getQueryData([QUERY_KEYS.MY_BADGES, 's1'])).toEqual({ badges: [] });
  });
});
