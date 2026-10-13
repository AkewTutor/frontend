import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import { useApproveRefund, useRefundQueue, useRejectRefund } from '@/hooks/useRefunds';

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

describe('useRefundQueue', () => {
  it('sends status, page and limit 20; key includes page and status', async () => {
    const data = { refunds: [], page: 2, limit: 20, total: 0 };
    mockedApi.get.mockResolvedValue({ data });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useRefundQueue(2, 'APPROVED'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/refunds', {
      params: { status: 'APPROVED', page: 2, limit: 20 },
    });
    expect(qc.getQueryData([QUERY_KEYS.REFUNDS, 2, 'APPROVED'])).toEqual(data);
  });

  it('leaves status undefined by default (API defaults to PENDING)', async () => {
    mockedApi.get.mockResolvedValue({ data: { refunds: [] } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useRefundQueue(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/refunds', {
      params: { status: undefined, page: 1, limit: 20 },
    });
  });

  it('normalizes a bare-array response', async () => {
    mockedApi.get.mockResolvedValue({ data: [{ id: 'r1' }, { id: 'r2' }] });
    const { wrapper } = setup();
    const { result } = renderHook(() => useRefundQueue(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      refunds: [{ id: 'r1' }, { id: 'r2' }],
      page: 1,
      limit: 20,
      total: 2,
    });
  });

  it('normalizes an empty bare array to an empty queue', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });
    const { wrapper } = setup();
    const { result } = renderHook(() => useRefundQueue(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ refunds: [], page: 1, limit: 20, total: 0 });
  });
});

describe('useApproveRefund', () => {
  it('POSTs approve and invalidates [REFUNDS]', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 'r1', status: 'APPROVED' } });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useApproveRefund(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('r1');
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/refunds/r1/approve');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.REFUNDS] });
  });
});

describe('useRejectRefund', () => {
  it('POSTs reject with only the reason in the body and invalidates [REFUNDS]', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 'r1', status: 'REJECTED' } });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useRejectRefund(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ refundId: 'r1', rejectionReason: 'Duplicate case' });
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/refunds/r1/reject', {
      rejectionReason: 'Duplicate case',
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.REFUNDS] });
  });
});
