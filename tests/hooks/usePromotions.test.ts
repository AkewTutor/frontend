import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import { useActivePromotions, useCreatePromotion } from '@/hooks/usePromotions';

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

describe('useActivePromotions', () => {
  it('GETs /promotions/active under the [PROMOTIONS] key', async () => {
    const data = { promotions: [] };
    mockedApi.get.mockResolvedValue({ data });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useActivePromotions(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/promotions/active');
    expect(qc.getQueryData([QUERY_KEYS.PROMOTIONS])).toEqual(data);
  });
});

describe('useCreatePromotion', () => {
  it('POSTs the full body and invalidates [PROMOTIONS]', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 'pr1', code: 'BACK', isActive: true } });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useCreatePromotion(), { wrapper });
    const body = {
      code: 'BACK',
      discountType: 'PERCENT' as const,
      discountValue: '10.00',
      validFrom: '2026-10-01T00:00:00.000Z',
      validTo: '2026-10-31T00:00:00.000Z',
    };
    await act(async () => {
      await result.current.mutateAsync(body);
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/promotions', body);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.PROMOTIONS] });
  });
});
