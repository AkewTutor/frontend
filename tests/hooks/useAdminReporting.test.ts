import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import {
  useActivityHistory,
  usePlatformHealth,
  useTutorPerformance,
} from '@/hooks/useAdminReporting';

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

afterEach(() => {
  vi.useRealTimers();
});

describe('usePlatformHealth', () => {
  const health = {
    openDisputes: 4,
    overdueMatchApprovals: 2,
    recordingComplianceEscalations: 1,
    pendingPayoutBatches: 0,
    generatedAt: '2026-09-06T15:00:00Z',
  };

  it('hits GET /admin/reports/platform-health and returns the payload', async () => {
    mockedApi.get.mockResolvedValue({ data: health });
    const { qc, wrapper } = setup();

    const { result } = renderHook(() => usePlatformHealth(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports/platform-health');
    expect(result.current.data).toEqual(health);
    expect(qc.getQueryData([QUERY_KEYS.PLATFORM_HEALTH])).toEqual(health);
  });

  it('refetches every 60 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockedApi.get.mockResolvedValue({ data: health });
    const { wrapper } = setup();

    renderHook(() => usePlatformHealth(), { wrapper });
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(60_000);
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(2));
  });
});

describe('useTutorPerformance', () => {
  it('hits GET /admin/reports/tutor-performance with params, key [TUTOR_PERFORMANCE, params]', async () => {
    const payload = {
      tutors: [],
      pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
    };
    const params = { page: 2, limit: 20, sortBy: 'badgeCount' };
    mockedApi.get.mockResolvedValue({ data: payload });
    const { qc, wrapper } = setup();

    const { result } = renderHook(() => useTutorPerformance(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports/tutor-performance', { params });
    expect(qc.getQueryData([QUERY_KEYS.TUTOR_PERFORMANCE, params])).toEqual(payload);
  });

  it('does not poll', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockedApi.get.mockResolvedValue({ data: { tutors: [], pagination: {} } });
    const { wrapper } = setup();

    renderHook(() => useTutorPerformance({ page: 1 }), { wrapper });
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(120_000);
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });
});

describe('useActivityHistory', () => {
  it('hits GET /admin/reports/activity with params, key [ACTIVITY_HISTORY, params]', async () => {
    const payload = {
      events: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
    const params = { page: 1, limit: 20, dateRange: '7d' as const, eventType: 'REFUND' as const };
    mockedApi.get.mockResolvedValue({ data: payload });
    const { qc, wrapper } = setup();

    const { result } = renderHook(() => useActivityHistory(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports/activity', { params });
    expect(qc.getQueryData([QUERY_KEYS.ACTIVITY_HISTORY, params])).toEqual(payload);
  });

  it('does not poll', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockedApi.get.mockResolvedValue({ data: { events: [], pagination: {} } });
    const { wrapper } = setup();

    renderHook(() => useActivityHistory({ page: 1 }), { wrapper });
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(120_000);
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });
});
