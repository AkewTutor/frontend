import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import { useActivePricing, useUpdatePricing } from '@/hooks/usePricing';

vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));

const mockedApi = vi.mocked(api);

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(qc, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { qc, invalidate, wrapper };
}

const row = {
  format: 'ONE_TO_ONE',
  pricePerStudentPerHour: '350.00',
  totalPerHour: '350.00',
  platformSharePerHour: '100.00',
  tutorSharePerHour: '250.00',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useActivePricing', () => {
  it('GETs /pricing under the [PRICING] key (documented { pricing } shape)', async () => {
    const data = { pricing: [row] };
    mockedApi.get.mockResolvedValue({ data });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useActivePricing(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/pricing');
    expect(qc.getQueryData([QUERY_KEYS.PRICING])).toEqual(data);
  });

  it('normalizes a bare-array response to { pricing }', async () => {
    mockedApi.get.mockResolvedValue({ data: [row] });
    const { wrapper } = setup();
    const { result } = renderHook(() => useActivePricing(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ pricing: [row] });
  });
});

describe('useUpdatePricing', () => {
  it('PUTs by format without format in the body and invalidates [PRICING]', async () => {
    mockedApi.put.mockResolvedValue({ data: { id: 'p1' } });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useUpdatePricing(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        format: 'ONE_TO_ONE',
        pricePerStudentPerHour: '375.00',
        totalPerHour: '375.00',
        platformSharePerHour: '100.00',
        tutorSharePerHour: '275.00',
      });
    });
    expect(mockedApi.put).toHaveBeenCalledWith('/admin/pricing/ONE_TO_ONE', {
      pricePerStudentPerHour: '375.00',
      totalPerHour: '375.00',
      platformSharePerHour: '100.00',
      tutorSharePerHour: '275.00',
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.PRICING] });
  });
});
