import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import { useInitiatePayment, useMyPayments, usePauseStatus } from '@/hooks/usePayments';

vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
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

describe('useInitiatePayment', () => {
  it('POSTs the membership id and promo code and returns the checkout data', async () => {
    const data = {
      paymentId: 'pay1',
      chapaCheckoutUrl: 'https://checkout.chapa.co/x',
      amount: '350.00',
      status: 'PENDING',
    };
    mockedApi.post.mockResolvedValue({ data });
    const { wrapper } = setup();
    const { result } = renderHook(() => useInitiatePayment(), { wrapper });
    let returned: unknown;
    await act(async () => {
      returned = await result.current.mutateAsync({
        cohortMembershipId: 'm1',
        promotionCode: 'BACK',
      });
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/payments/initiate', {
      cohortMembershipId: 'm1',
      promotionCode: 'BACK',
    });
    expect(returned).toEqual(data);
  });
});

describe('useMyPayments', () => {
  it('sends studentId, page and limit 20; key includes page and student', async () => {
    const data = { payments: [], page: 2, limit: 20, total: 0 };
    mockedApi.get.mockResolvedValue({ data });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useMyPayments(2, 's1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/payments/history', {
      params: { studentId: 's1', page: 2, limit: 20 },
    });
    expect(qc.getQueryData([QUERY_KEYS.PAYMENT_HISTORY, 2, 's1'])).toEqual(data);
  });

  it('defaults to page 1 with no studentId', async () => {
    mockedApi.get.mockResolvedValue({ data: { payments: [] } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useMyPayments(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/payments/history', {
      params: { studentId: undefined, page: 1, limit: 20 },
    });
  });

  it('normalizes a bare-array response', async () => {
    mockedApi.get.mockResolvedValue({ data: [{ id: 'pay1' }] });
    const { wrapper } = setup();
    const { result } = renderHook(() => useMyPayments(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      payments: [{ id: 'pay1' }],
      page: 1,
      limit: 20,
      total: 1,
    });
  });
});

describe('usePauseStatus', () => {
  it('does not fetch without a cohortMembershipId', () => {
    const { wrapper } = setup();
    renderHook(() => usePauseStatus(undefined), { wrapper });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('fetches with the cohortMembershipId param', async () => {
    mockedApi.get.mockResolvedValue({ data: { isPaused: false } });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => usePauseStatus('m1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/payment-pause/status', {
      params: { cohortMembershipId: 'm1' },
    });
    expect(qc.getQueryData([QUERY_KEYS.PAUSE_STATUS, 'm1'])).toEqual({ isPaused: false });
  });
});
