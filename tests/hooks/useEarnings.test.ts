import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import { useMyEarnings } from '@/hooks/useEarnings';

vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn() },
}));

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

describe('useMyEarnings', () => {
  it('sends page and limit 20; key includes the page', async () => {
    const data = { earnings: [], upcomingPayout: {}, page: 2, limit: 20, total: 0 };
    mockedApi.get.mockResolvedValue({ data });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useMyEarnings(2), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/tutors/me/earnings', {
      params: { page: 2, limit: 20 },
    });
    expect(qc.getQueryData([QUERY_KEYS.EARNINGS, 2])).toEqual(data);
  });

  it('defaults to page 1', async () => {
    mockedApi.get.mockResolvedValue({ data: { earnings: [] } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useMyEarnings(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/tutors/me/earnings', {
      params: { page: 1, limit: 20 },
    });
  });
});
