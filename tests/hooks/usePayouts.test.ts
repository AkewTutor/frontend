import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import { useMarkPaid, usePayoutBatches } from '@/hooks/usePayouts';

vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

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

describe('usePayoutBatches', () => {
  it('sends page and limit 20; key includes the page', async () => {
    const data = { payouts: [], page: 3, limit: 20, total: 0 };
    mockedApi.get.mockResolvedValue({ data });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => usePayoutBatches(3), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/payouts', {
      params: { page: 3, limit: 20 },
    });
    expect(qc.getQueryData([QUERY_KEYS.PAYOUTS, 3])).toEqual(data);
  });
});

describe('useMarkPaid', () => {
  it('POSTs mark-paid and invalidates [PAYOUTS]', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 'p1', status: 'PAID' } });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useMarkPaid(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('p1');
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/payouts/p1/mark-paid');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.PAYOUTS] });
  });
});
